# Orchestrator/Subagent Model Routing — Design Spec

Status: Approved
Date: 2026-08-01
Scope: `D:\Projects\portfolio` (Claude Code project configuration only — no application code)

## Status

Implemented on 2026-08-01. Revised same day after an adversarial review applied 15 approved fixes
to the agent definitions and CLAUDE.md; this document has been synced to match — it must not
contradict the files. Two operational notes for anyone extending this design:

- **Session restart required.** Agent definitions in `.claude/agents/` are scanned at session
  start; a file added or renamed mid-session does not resolve until the session restarts. Verified
  empirically on 2026-08-01: dispatching a newly-written agent by name in the same session that
  created it failed with `"Agent type not found"`.
- **`skills:` preloading is VERIFIED.** Whether `skills:` frontmatter actually preloads the
  named skill's content into a subagent's context (as opposed to being inert metadata) has been
  confirmed empirically: on 2026-08-01 a live builder agent quoted the full ponytail ladder and
  all four karpathy-guidelines headings verbatim from its context, and the dispatching prompt
  never mentioned either skill — the only declaration was the `skills:` frontmatter field.
  builder.md and specialist.md still carry a compact inline summary of the ponytail ladder
  directly in their body prompts, as defense-in-depth, not because the mechanism is in doubt.

## Intent

Turn the main Claude Code session into a pure orchestrator: brain, planner, reviewer. It does
not touch the filesystem itself. All recon, implementation, and review are delegated to
subagents, each pinned to the model that fits the shape of its work (haiku / sonnet / opus).

## Problem

Today the main session does everything at whatever model it happens to be running: reading
files, greping, writing code, and reviewing its own output, all at one cost/capability tier.
That has three consequences:
- Cheap recon (find a file, check a config value) costs as much as hard implementation work,
  because it runs on the same model.
- There is no separation between "the agent that wrote the diff" and "the agent that checks
  it" — self-review is weak because the author and the reviewer share the same blind spots.
- There is no mechanism to route a genuinely hard call (architecture, security, a gnarly bug)
  to more reasoning effort than a routine edit gets.

This spec fixes that by splitting work across four purpose-built subagents and making the main
session delegate to them instead of acting directly.

## The four agents

All four are project-level definitions at `.claude/agents/<name>.md`, which take precedence
over any `~/.claude/agents/` equivalent. `tools` is a comma-separated string, not a YAML list;
omitting it inherits the full subagent-available tool pool.

### scout

```yaml
name: scout
model: haiku
effort: low
tools: Read, Glob, Grep, Bash
color: cyan
```

Read-only recon tier. Locates files, greps, lists directories, reads config, summarizes. This
is the high-frequency, cheap tier — the default for any "where is X" / "what is in Y" question.

The original design used `disallowedTools: Edit, Write, NotebookEdit` (a denylist) instead of the
`tools:` allowlist shown above. That was abandoned because a denylist leaves everything else —
including Bash and PowerShell — in the inherited tool pool, so the agent was never actually
read-only, just nominally so; Bash was then deliberately restored (rather than left out of the
allowlist) because challenger cannot review a diff it cannot run `git diff` to see, and scout
follows the same shape for consistency. The honest ceiling: read-only is enforced by instruction
(the body prompt's "Read-only" rules below, now a strict Bash command allowlist rather than a
loose category description), not structurally — an allow-listed Bash can still write if the agent
disobeys the instruction.

Body prompt must enforce:
- Report facts only. Never recommend, never redesign, never edit.
- Cite `file:line` for claims about file content; for facts established by running a command
  (`ls`, `git status`, `wc`, etc. — these produce no line numbers), cite the exact command run
  instead. Both count as citation — an uncited assertion is still forbidden.
- If something is not found, say so explicitly — never guess or infer.
- Every recon answer states its COVERAGE: what was searched (paths/globs/patterns), how many
  matches were found, and whether the result set may be incomplete. Reporting incomplete coverage
  is REQUIRED and is not hedging — the ban on guessing bans inventing facts, never presenting a
  partial search as exhaustive. (Added 2026-08-01: without this, a small model converts "I found
  3 of 5" into a confident "there are 3".)
- Answer every question asked, in a single pass (callers batch questions deliberately; there is
  no cheap way to ask a follow-up).
- Output terse and structured. No preamble, no closing summary.
- Bash is restricted to an explicit ALLOWLIST, not a "read-only commands" description: `git diff`,
  `git log`, `git show`, `git status`, `git check-ignore`, `git ls-files`, `git blame`, `ls`,
  `cat`, `head`, `tail`, `wc`, and `--version`/`--help` probes. Everything else is forbidden,
  including ALL npm/pnpm/yarn scripts (`npm run ci` migrates PRODUCTION via
  `DATABASE_URL_UNPOOLED`; `npm run dev` mutates the dev DB schema), all docker commands, non-GET
  curl/wget, every mutating git verb (checkout, restore, reset, clean, stash, add, commit,
  config), in-place editors (`sed -i`, `perl -pi`), filesystem creation (mkdir, touch, ln, chmod),
  and any redirection. If a needed command is not on the allowlist, stop and report the need
  rather than run it. The permission layer pre-approves a broad set of Bash and PowerShell
  commands in `.claude/settings.local.json` — more than you would expect, including
  `docker-compose down`. Never infer that an unlisted command will prompt; this allowlist is the
  only guard, consult that file if unsure. (Revised 2026-08-01: the earlier wording, "read-only
  test or lint commands," permitted exactly the catastrophic commands above; see "## Status"
  history in git for the incident that prompted this.)
- Never reproduce a credential value — token, password, API key, connection string, private key,
  session cookie — from ANY source, including `git log -p` / `git show` output, `~/.npmrc`,
  `~/.docker/config.json`, `.git/config`, Vercel CLI auth files, or raw-SQL migration/seed files,
  regardless of the file's name or location. This is a rule about the DATA CLASS, not the
  filename. Report presence and key name only. (Revised 2026-08-01: the original rule only named
  filenames like `.env*`, which `git log -p`/`git show` — both explicitly allowed commands — can
  route around entirely.)

### builder

```yaml
name: builder
model: sonnet
effort: high
skills: ponytail:ponytail, andrej-karpathy-skills:karpathy-guidelines
color: green
```

Implementation tier. Code, tests, refactors, docs, mechanical migrations. Full tools.

Body prompt must enforce:
- Implement exactly the given spec and nothing more.
- Surgical diffs — every changed line traceable to the request.
- Match surrounding style. Do not refactor adjacent code.
- Leave behind the smallest runnable check that fails if non-trivial logic breaks — no framework,
  no fixtures; do not claim it works without running it yourself first. (This was previously two
  separate, overlapping bullets with inconsistent wording; merged into one on 2026-08-01.)
- Although `skills:` preloading is now VERIFIED (see "## Status"), the body prompt also carries
  an inline, under-12-line summary of the six-rung ponytail ladder — does this need to exist at
  all / standard library / native platform feature / already-installed dependency / one line /
  only then the minimum code that works — plus "no unrequested abstractions, no speculative
  scaffolding, deletion over addition, boring over clever." This is defense-in-depth, not a
  fallback for an unproven mechanism; the `skills:` field is kept too (belt and braces).
- Final report must end with the canonical report contract (below).

#### Report contract

See CLAUDE.md § Orchestration Protocol — authoritative; not duplicated here.

Which rung of the ponytail ladder the agent stopped at is deliberately NOT part of the contract
(dropped 2026-08-01): rung 6 — "the minimum code that works" — is the truthful answer for every
diff that exists, since a diff is proof code was written. It is a constant, not a signal, and
"rung 6; skipped: nothing" was always truthful, always passed review, and carried zero
information. The `skipped:` line's stronger requirements (above) replace it as the actual signal.

### specialist

```yaml
name: specialist
model: opus
effort: xhigh
skills: ponytail:ponytail, andrej-karpathy-skills:karpathy-guidelines, superpowers:systematic-debugging
color: blue
```

`effort` is a real frontmatter field and `xhigh` is a real value — referenced in the installed
CLI's changelog; models other than the one it's set for fall back to `high`.

The accepted `color` values are not reliably documented; shipped agents use values from both
candidate lists seen on disk, and the field appears unvalidated and is purely cosmetic.

Deep-reasoning tier. Architecture decisions, hard debugging, security, performance — work where
being wrong is expensive. Used sparingly.

Body prompt must enforce:
- State assumptions explicitly.
- Present competing interpretations rather than silently picking one.
- Recommend, with the reasoning visible.
- Push back when the requested approach is wrong.
- The same inline ponytail-ladder fallback as builder (see above), for the same defense-in-depth
  reason (not because `skills:` preloading is in doubt).
- Final report must end with the canonical report contract (see builder, above). The rung
  requirement is dropped here too, for the same reason.

### challenger

```yaml
name: challenger
model: opus
effort: xhigh
tools: Read, Glob, Grep, Bash
color: red
```

Same denylist-to-allowlist history as scout (above): `disallowedTools: Edit, Write, NotebookEdit`
left Bash/PowerShell inherited and unrestricted, so it wasn't structurally read-only; Bash is kept
in the allowlist because challenger cannot review a diff it cannot run `git diff` to see. Same
ceiling as scout: read-only is enforced by instruction (now a strict Bash command allowlist, see
below), not structurally.

Adversarial reviewer. Attacks a plan, design, or diff. Read-only by design: an agent that can
patch what it criticizes stops criticizing.

As of 2026-08-01, the body prompt is split into two sections because the general rules below do
not fit the plan-review gate (CLAUDE.md's adversarial gate point 1, before any diff exists):

**"Reviewing a plan (pre-execution)"** — the general adversarial rules below, applied directly to
the plan. No diff exists at this gate, so the diff-only duties (re-running commands, report-
contract compliance, the over-engineering-in-code scan) do not apply.

**General adversarial rules (both gates):**
- Your job is to find what is wrong. Agreement is failure unless you earned it.
- Start from the assumption the plan is flawed and go looking for the flaw.
- Verify claims against the actual code. Critique reality, not the author's description of it.
- Every finding states: what breaks, the concrete input or state that breaks it, and why the
  author plausibly missed it.
- Rank by severity. Hard-separate "this is incorrect" from "I would have done it differently" —
  only the first is a finding at all.
- Over-engineering is an explicit review dimension: speculative abstraction, an interface with one
  implementation, config for a value that never changes, an unnecessary new dependency, or
  scaffolding built "for later" all count as findings.
- Do not propose a rewrite or a patch, even if invited to. Name the defect. The orchestrator
  decides the fix.
- Unstated assumptions and silent omissions are the most common real defect — hunt those first.
- "No material objection" is legitimate and non-penalized — but only when paired with a coverage
  list (what was checked) and a would-have-changed-my-mind statement. A bare, unsupported pass —
  missing either — is a failed review.
- Never reproduce a credential value — token, password, API key, connection string, private key,
  session cookie — from ANY source, including `git log -p`/`git show` on the diff or history under
  review, regardless of file name or location. Report presence and key name only. (Added
  2026-08-01: challenger has Read and Bash and reviews diffs that can contain secrets, but
  previously had no rule about this at all.)

**"Reviewing a diff (pre-completion)"** — in addition to the general rules:
- If the author's report claims a verification command was run, re-run that exact command and
  report claimed vs. actual output. A mismatch is a top-severity finding. If the command cannot be
  run (not on the Bash allowlist, or its required state is unavailable), say so explicitly. (Added
  2026-08-01: this is the mechanism that closes the verification loop — the orchestrator cannot
  run commands itself, so a builder could otherwise fabricate command output undetected.)
- Check the report against the canonical report contract (see builder, above) and record
  compliance in a separate "Process notes" section — explicitly NOT a finding. (Fixed 2026-08-01:
  the previous wording made a missing contract "itself a finding," which directly contradicted the
  rule two lines above it that only "this is incorrect" counts as a finding — a contradiction that
  handed the model a zero-effort finding it could always reach for. The two are now separated:
  contract compliance is process notes, not a finding.)
- Bash is restricted to scout's explicit allowlist (see scout, above) PLUS additional read-only/
  diagnostic commands: `git status --short --untracked-files=all`,
  `git ls-files --others --exclude-standard`, `npm run lint` / `npm run lint:*` (bare eslint, no
  writes; excludes any `lint:*` script whose definition writes files, e.g. `--fix` variants), and
  `cd D:/Projects/portfolio/frontend && npx tsc --noEmit` — both must run as
  `cd D:/Projects/portfolio/frontend && npm run lint` / `cd D:/Projects/portfolio/frontend && npx tsc --noEmit`
  since there is no package.json at the repo root — plus explicit bans on `npm run ci`/`dev`/`build`/`start`/
  `generate:types`/`generate:importmap`. Same catastrophe-avoidance rationale as scout, same
  `.claude/settings.local.json` caveat.

## Delegation rule

See CLAUDE.md § Orchestration Protocol — authoritative; not duplicated here.

Until 2026-08-01 this section also stated a five-tool "calls only" allowlist (Agent, Workflow,
Skill, AskUserQuestion, the Task tools) alongside the denylist. The two disagreed — the allowlist
omitted ToolSearch, WebFetch, WebSearch, and every MCP tool entirely, which would have made the
orchestrator unable to use the Vercel MCP tool set or load any deferred tool at all. The "calls
only" sentence was deleted; the denylist alone now controls, and the tools named in CLAUDE.md are
explicit permitted examples, not an exhaustive list.

This is a soft rule, enforced by the CLAUDE.md text (see below), not by tooling. See "Explicitly
rejected alternatives" for why it isn't hard-enforced yet, and the CLAUDE.md upgrade path for
what would make it hard.

## Routing table

See CLAUDE.md § Orchestration Protocol — authoritative; not duplicated here. Omitting
`subagent_type`, or naming a built-in type (general-purpose, Explore, Plan), silently defaults to
a full-tool agent with no contract, no read-only ceiling, and no gate — while violating nothing
written down elsewhere, which made the whole protocol bypassable by doing nothing in particular.

## Adversarial gate

See CLAUDE.md § Orchestration Protocol — authoritative; not duplicated here.

## Re-dispatch limits and arbitration

See CLAUDE.md § Orchestration Protocol — authoritative; not duplicated here. This closes a gap
where re-dispatch had no retry cap, no severity floor, and no arbitration path when builder and
challenger disagreed on fact.

## CLAUDE.md change

See CLAUDE.md § Orchestration Protocol — authoritative; not duplicated here.

## Explicitly rejected alternatives

**`permissions.deny` on Read/Edit/Write/Grep/Glob for the main agent.** Rejected because
`permissions.deny` on a bare tool name strips that tool from subagents too — subagents inherit
the main conversation's tool pool. This would silently disable scout and builder, defeating the
entire design. There is no config-only way to restrict tools to "main session only."

**A blocking `PreToolUse` hook.** DISPUTED, not settled. Hard enforcement would require
distinguishing main-agent from subagent tool calls inside a PreToolUse hook. The idea was a
`PreToolUse` hook matching `Read|Edit|Write|Grep|Glob` keyed on an `agent_id` field in the hook
input JSON (absent = main agent, present = subagent). Whether the hook input exposes a field
permitting that distinction is UNVERIFIED: published documentation states that it does; an
inspection of the installed CLI's hook-input schema suggested `agent_id` is never present on
`PreToolUse` (only on `SubagentStart`/`SubagentStop`). Documentation and the inspection disagree,
so this must be tested empirically before anyone relies on it — do NOT assert either side as fact.
No verified hard-enforcement mechanism currently exists; the rule stays soft (CLAUDE.md text only)
until one is tested and confirmed.

**Preloading `superpowers:test-driven-development` into builder.** Rejected (dropped after initial
approval): this repo has no test runner configured, so forcing a TDD skill onto builder made it
stand up a test harness for trivial changes, contradicting ponytail. builder instead leaves behind
the smallest runnable check that fails if non-trivial logic breaks — no framework, no fixtures.
Restore `superpowers:test-driven-development` to builder's `skills:` list when a test runner is
configured in this repo.

**Role-per-agent proliferation** (e.g., separate agents per language, per collection, per task
type). Rejected in favor of three cost tiers (scout / builder / specialist) plus one adversary
(challenger). Task-shape routing on four agents is simple to reason about and cheap to maintain;
a larger roster of narrow roles would multiply frontmatter and prompt-maintenance burden without
changing what any individual dispatch actually needs (recon, build, deep reasoning, or attack).

## Known costs

Every lookup that used to be a direct `Read`/`Grep`/`Glob` call from the main session is now a
subagent round-trip: a dispatch, a model invocation, and a response to parse, instead of an
in-process tool call. This is strictly slower and adds token overhead per lookup, even for
trivial ones ("does this file exist").

Mitigations:
- scout runs on haiku at `effort: low` specifically to keep the per-lookup cost and latency
  floor as low as the routing model allows.
- Callers are expected to batch recon questions into a single scout dispatch rather than
  issuing one dispatch per question — scout's body prompt requires it to answer every question
  asked in one pass for exactly this reason. A five-question recon pass should be one round-trip,
  not five.

These mitigate the cost; they do not eliminate it. A workflow dominated by many small,
sequential, dependent lookups (each needing the previous answer before the next question can be
formed) will still feel slower than direct filesystem access did.

This predicted cost was realized in practice on 2026-08-01 — trivial lookups became full
subagent round-trips — and the Delegation rule was loosened same-day with a narrow single-call
exception for short lookups; CLAUDE.md § Orchestration Protocol § Delegation rule is authoritative
for the current wording, not duplicated here.
