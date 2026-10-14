#!/usr/bin/env node
// Claude Code status line: model │ context bar + % (used/window) │ branch.
// Also caches the context % in .claude/.state/context.json for hooks/context-guard.mjs (ported from shripratima).
import { readFileSync, writeFileSync, mkdirSync, openSync, readSync, fstatSync, closeSync, existsSync } from 'node:fs'
import { join } from 'node:path'

let d = {}
try { d = JSON.parse(readFileSync(0, 'utf8')) } catch {}
const root = d.workspace?.project_dir || d.cwd || process.cwd()

const inputTokens = (u) => (u?.input_tokens || 0) + (u?.cache_creation_input_tokens || 0) + (u?.cache_read_input_tokens || 0)

// Fallback: last main-thread assistant usage from the transcript tail.
function transcriptUsage(path) {
  try {
    const fd = openSync(path, 'r')
    const size = fstatSync(fd).size
    const len = Math.min(size, 2_000_000)
    const buf = Buffer.alloc(len)
    readSync(fd, buf, 0, len, size - len)
    closeSync(fd)
    const lines = buf.toString('utf8').split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].includes('"usage"')) continue
      try {
        const j = JSON.parse(lines[i])
        if (j.isSidechain || !j.message?.usage) continue
        return inputTokens(j.message.usage)
      } catch {}
    }
  } catch {}
  return null
}

const cw = d.context_window || {}
const modelId = String(d.model?.id || '')
const win = cw.context_window_size || (modelId.includes('[1m]') ? 1_000_000 : Number(process.env.CLAUDE_CTX_WINDOW) || 200_000)
let used = cw.current_usage ? inputTokens(cw.current_usage) : null
if (used == null && d.transcript_path) used = transcriptUsage(d.transcript_path)
const pct = typeof cw.used_percentage === 'number' ? cw.used_percentage : used != null ? (used / win) * 100 : null

try {
  const dir = join(root, '.claude', '.state')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'context.json'), JSON.stringify({ session_id: d.session_id, pct, used, win, ts: Date.now() }))
} catch {}

const k = (n) => (n >= 1e6 ? (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + 'M' : Math.round(n / 1e3) + 'k')
const C = { dim: '\x1b[2m', g: '\x1b[32m', y: '\x1b[33m', r: '\x1b[31m', b: '\x1b[1m', x: '\x1b[0m' }
let ctx = `${C.dim}ctx n/a${C.x}`
if (pct != null) {
  const p = Math.max(0, Math.min(100, pct))
  const col = p >= 90 ? C.r : p >= 70 ? C.y : C.g
  const filled = Math.round(p / 10)
  ctx = `${col}${'█'.repeat(filled)}${C.dim}${'░'.repeat(10 - filled)}${C.x} ${col}${C.b}${p.toFixed(0)}%${C.x}` +
    (used != null ? ` ${C.dim}${k(used)}/${k(win)}${C.x}` : '') + (p >= 90 ? ` ${C.r}${C.b}⚠ HANDOFF${C.x}` : '')
}

let branch = ''
try {
  const head = join(root, '.git', 'HEAD')
  if (existsSync(head)) branch = readFileSync(head, 'utf8').trim().replace('ref: refs/heads/', '').slice(0, 24)
} catch {}

const model = d.model?.display_name || modelId || 'model'
process.stdout.write([`${C.b}${model}${C.x}`, ctx, branch && `${C.dim}⎇ ${branch}${C.x}`].filter(Boolean).join(' │ '))
