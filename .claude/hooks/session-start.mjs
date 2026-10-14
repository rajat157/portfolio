#!/usr/bin/env node
// SessionStart hook: injects the "## Resume" section of PROGRESS.md so a fresh session (/clear, restart) knows
// exactly where the work stopped (ported from shripratima). See CLAUDE.md "Context handoff".
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd()
try {
  const md = readFileSync(join(root, 'PROGRESS.md'), 'utf8')
  const m = md.match(/## Resume[\s\S]*?(?=\n## |\n---)/)
  if (m) process.stdout.write(`PROJECT STATE (PROGRESS.md "Resume"; follow CLAUDE.md "Context handoff"):\n${m[0].trim()}\n`)
} catch {}
