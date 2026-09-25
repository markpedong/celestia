# Celestia auto-commits

Celestia uses [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).
Keep individual features, fixes, tests, and documentation changes in separate reviewable commits.
Use the standard type(scope): description prefix; a hyphen can separate additional context in
the description (for example, fix(account): persist deletion requests - retry cleanup).

## Run the watcher

- pnpm watch:commits:start — start a detached local watcher on the current feature branch.
- pnpm watch:commits:status — check whether it is running.
- pnpm watch:commits:stop — stop the watcher.
- pnpm watch:commits — run in the foreground instead, until Ctrl+C.
- node scripts/auto-commit.mjs once --dry-run — preview eligible paths without committing.

The watcher polls Git every five seconds and waits until changes have been quiet for 45 seconds.
It then runs pnpm typecheck, pnpm lint, and pnpm test. If all pass and the files
remain unchanged, it stages only the observed eligible paths and creates a local
Conventional Commit such as chore(auto): capture - project changes. It never pushes,
amends, stashes, or rebases, and stops when the active branch changes. Automated
messages are deliberately generic: review and reword them before merging if the
changes need more specific semantic types.

It does not commit while other files are staged, while validation fails, while
files are still changing, or when suspected secrets or whitespace errors are found.
Git-ignored paths (including .env*, .next, and node_modules) remain ignored,
and the watcher also skips private-key, secret, credential, and database-like filenames.
These protections are best-effort: never place real secrets in source code.

Output, the PID file, and operational state live locally under .git/:
celestia-auto-commit.log and celestia-auto-commit.pid. Check the log if
a change was skipped. The detached watcher runs while your Mac and user session
remain active; restart it after logging back in or rebooting.

The versioned commit-message hook is enabled locally with:

~~~sh
git config --local core.hooksPath .githooks
chmod +x .githooks/commit-msg
~~~

The hook checks commit headers, including manual commits. It does not rewrite
messages. Do not enable auto-commits on main or master; use a feature branch.
