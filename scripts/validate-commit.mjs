#!/usr/bin/env node
import { readFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/validate-commit.mjs <commit-message-file>')
  process.exit(1)
}

const header = readFileSync(file, 'utf8').split(/\r?\n/).find(line => line.trim() && !line.startsWith('#')) ?? ''
const conventional = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9-]+\))?!?: \S.{0,71}$/

if (!conventional.test(header)) {
  console.error('Invalid commit message. Use: type(scope): description - detail')
  console.error('Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert')
  process.exit(1)
}
