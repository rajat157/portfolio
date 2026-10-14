#!/usr/bin/env node
// PostToolUse hook: tells the main agent when its context is filling up (ported from shripratima).
//   >= WARN (85%): once per session: finish the current step, commit, update the PROGRESS.md "Resume" section.
//   >= CRIT (96%): every call: stop and hand off (the user /clears and pastes the reprompt).
// Reads the % cached by .claude/statusline.mjs; silent if unknown or inside a subagent. See CLAUDE.md "Context handoff".
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const WARN = Number(process.env.CTX_WARN_PCT || 85)
const CRIT = Number(process.env.CTX_CRIT_PCT || 96)

let input = {}
try { input = JSON.parse(readFileSync(0, 'utf8')) } catch {}
if (input.agent_id) process.exit(0) // subagent tool call: not our context

const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
const dir = join(root, '.claude', '.state')
let ctx
try { ctx = JSON.parse(readFileSync(join(dir, 'context.json'), 'utf8')) } catch { process.exit(0) }
if (ctx.pct == null || (input.session_id && ctx.session_id && ctx.session_id !== input.session_id)) process.exit(0)

const pct = Math.round(ctx.pct)
const say = (msg) => {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: msg } }))
  process.exit(0)
}

if (pct >= CRIT) {
  say(`CONTEXT CRITICAL (${pct}%). Stop feature work now (CLAUDE.md "Context handoff"): 1) stop background servers 2) git commit (WIP is fine) + push the branch 3) rewrite the "## Resume" section at the top of PROGRESS.md (branch, done, in progress, exact next action, blockers) and the memory note's RESUME HERE 4) reply with a short handoff report ending with the reprompt from PROGRESS.md, and tell the user to /clear then paste it.`)
}
if (pct >= WARN) {
  let guard = {}
  try { guard = JSON.parse(readFileSync(join(dir, 'guard.json'), 'utf8')) } catch {}
  if (guard[input.session_id]) process.exit(0)
  guard[input.session_id] = true
  try { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, 'guard.json'), JSON.stringify(guard)) } catch {}
  say(`CONTEXT HIGH (${pct}%). Finish only the current step, then commit + push and update the PROGRESS.md "Resume" section. Avoid large reads and screenshots; delegate bulk work to subagents. Handoff is mandatory at ${CRIT}% (CLAUDE.md "Context handoff").`)
}
