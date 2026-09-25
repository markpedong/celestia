#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, openSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const git = (args, options = {}) => {
  const { raw = false, ...spawnOptions } = options
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...spawnOptions })
  if (result.status !== 0) throw new Error(result.stderr?.trim() || 'Git command failed: ' + args.join(' '))
  return raw ? result.stdout : result.stdout.trim()
}
const gitDir = git(['rev-parse', '--absolute-git-dir'])
const pidFile = join(gitDir, 'celestia-auto-commit.pid')
const logFile = join(gitDir, 'celestia-auto-commit.log')
const intervalMs = 5000
const quietMs = 45000

const getPid = () => {
  if (!existsSync(pidFile)) return null
  const pid = Number(readFileSync(pidFile, 'utf8').trim())
  if (!Number.isSafeInteger(pid) || pid < 1) return null
  try {
    process.kill(pid, 0)
    return pid
  } catch {
    unlinkSync(pidFile)
    return null
  }
}

const getBranch = () => git(['branch', '--show-current'])
const validBranch = branch => branch && branch !== 'main' && branch !== 'master'
const isSafePath = path => {
  const parts = path.toLowerCase().split('/')
  return !parts.some(part =>
    part === '.git' ||
    part === 'node_modules' ||
    part === '.next' ||
    part === '.ds_store' ||
    /^\.env/.test(part) ||
    /(?:secret|credential|private-key)/.test(part) ||
    /\.(?:pem|key|p12|pfx|sqlite|db|log)$/.test(part)
  )
}

const snapshot = () => {
  // NUL-separated porcelain handles whitespace and special characters in paths.
  const output = git(['status', '--porcelain=v1', '-z', '--untracked-files=all'], { raw: true })
  const entries = output.split('\0')
  const paths = new Set()
  let staged = false
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    if (!entry) continue
    const state = entry.slice(0, 2)
    const path = entry.slice(3)
    if (state[0] !== ' ' && state[0] !== '?') staged = true
    if (isSafePath(path)) paths.add(path)
    if (state.includes('R') || state.includes('C')) {
      const oldPath = entries[++i]
      if (oldPath && isSafePath(oldPath)) paths.add(oldPath)
    }
  }

  const selected = [...paths].sort()
  const fingerprint = selected.map(path => {
    try {
      const stat = statSync(join(root, path))
      return path + ':' + stat.size + ':' + stat.mtimeMs
    } catch {
      return path + ':deleted'
    }
  }).join('|')
  return { paths: selected, fingerprint, staged }
}

const check = (script) => {
  console.log('[auto-commit] Checking: pnpm ' + script)
  const result = spawnSync('pnpm', [script], { cwd: root, stdio: 'inherit', timeout: 180000 })
  return result.status === 0
}

const containsSecret = () => {
  const diff = git(['diff', '--cached', '--unified=0', '--no-ext-diff'])
  return /^\+[^+].*(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9]{32,}|AKIA[A-Z0-9]{16})/m.test(diff)
}

const commitSnapshot = (before, branch) => {
  if (getBranch() !== branch || !validBranch(branch)) return false
  if (!check('typecheck') || !check('lint') || !check('test')) {
    console.warn('[auto-commit] Validation failed - changes left uncommitted.')
    return false
  }

  const after = snapshot()
  if (after.staged || after.fingerprint !== before.fingerprint || git(['diff', '--cached', '--name-only'])) {
    console.log('[auto-commit] Files or index changed during checks - retry after edits settle.')
    return false
  }
  if (!after.paths.length) return false

  git(['add', '-A', '--', ...after.paths])
  try {
    if (git(['diff', '--cached', '--name-only']) === '') return false
    if (containsSecret()) {
      console.warn('[auto-commit] Possible secret detected - no commit created.')
      return false
    }
    if (spawnSync('git', ['diff', '--cached', '--check'], { cwd: root, stdio: 'inherit' }).status !== 0) {
      console.warn('[auto-commit] Whitespace errors - no commit created.')
      return false
    }
    if (getBranch() !== branch || snapshot().fingerprint !== after.fingerprint) {
      console.log('[auto-commit] Files changed while staging - no commit created.')
      return false
    }
    const parents = new Set(after.paths.map(path => path.split('/')[0]))
    const area = parents.size === 1 ? [...parents][0].replace(/[^a-z0-9-]/gi, '-') : 'project'
    const type = area === 'docs' ? 'docs' : area === 'tests' ? 'test' : 'chore'
    const message = type + '(auto): capture - ' + area + ' changes'
    git(['commit', '-m', message])
    console.log('[auto-commit] Committed: ' + message)
    return true
  } finally {
    // Never leave partially staged files after a rejected automated commit.
    if (git(['diff', '--cached', '--name-only'])) git(['restore', '--staged', '--', ...after.paths])
  }
}

const watch = async () => {
  const branch = process.env.CELESTIA_WATCH_BRANCH || getBranch()
  if (!validBranch(branch)) throw new Error('Auto-commit requires a feature branch, not main/master.')
  const cleanup = () => {
    if (getPid() === process.pid) unlinkSync(pidFile)
    process.exit(0)
  }
  process.on('SIGTERM', cleanup)
  process.on('SIGINT', cleanup)

  console.log('[auto-commit] Watching ' + branch + ' - 45s idle window; no automatic push.')
  let previous = ''
  let changedAt = Date.now()
  let attempted = ''
  while (true) {
    if (getBranch() !== branch) {
      console.log('[auto-commit] Branch changed - stopping.')
      cleanup()
    }

    const current = snapshot()
    if (current.fingerprint !== previous) {
      previous = current.fingerprint
      changedAt = Date.now()
      attempted = ''
    } else if (!current.staged && current.paths.length && previous !== attempted && Date.now() - changedAt >= quietMs) {
      attempted = previous
      try {
        commitSnapshot(current, branch)
      } catch (error) {
        console.error('[auto-commit] Commit skipped:', error instanceof Error ? error.message : 'Unknown error')
      }
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
}

const action = process.argv[2] || 'status'
if (action === 'start') {
  const existing = getPid()
  if (existing) {
    console.log('[auto-commit] Already running (PID ' + existing + ').')
  } else {
    const branch = getBranch()
    if (!validBranch(branch)) throw new Error('Switch to a feature branch before starting auto-commit.')
    const log = openSync(logFile, 'a')
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), 'run'], {
      cwd: root,
      env: { ...process.env, CELESTIA_WATCH_BRANCH: branch },
      detached: true,
      stdio: ['ignore', log, log],
    })
    writeFileSync(pidFile, String(child.pid))
    child.unref()
    console.log('[auto-commit] Started (PID ' + child.pid + '). Log: ' + logFile)
  }
} else if (action === 'stop') {
  const pid = getPid()
  if (pid) {
    process.kill(pid, 'SIGTERM')
    console.log('[auto-commit] Stop signal sent to PID ' + pid + '.')
  } else {
    console.log('[auto-commit] Not running.')
  }
} else if (action === 'status') {
  const pid = getPid()
  console.log(pid ? '[auto-commit] Running (PID ' + pid + '). Log: ' + logFile : '[auto-commit] Not running.')
} else if (action === 'once' && process.argv.includes('--dry-run')) {
  const current = snapshot()
  console.log('[auto-commit] Eligible paths: ' + JSON.stringify(current.paths))
  console.log('[auto-commit] Index has staged changes: ' + current.staged)
} else if (action === 'run') {
  await watch()
} else {
  console.error('Usage: node scripts/auto-commit.mjs start|stop|status|run|once --dry-run')
  process.exitCode = 1
}
