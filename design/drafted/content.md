# Shared content pack — two design studies

Legend: **[V]** verbatim (exact source text) · **[P]** paraphrase (my tight rewording of a cited line). Every line below carries a `file:line` cite. See `gaps` at the end for everything missing or uncertain, and `content.json` for the machine-readable version with the same citations.

---

## Person

- **Name [V]:** Rajat Kumar R — `snapshot-about.json:2`
- **Role [V]:** Software Architect & Developer — `snapshot-about.json:3`
- **Base [V]:** Bangalore, India — `snapshot-about.json:7`
- **Years [V]:** 8+ years — `snapshot-about.json:5`
- **Email [V]:** rajat.kumar.r@outlook.com — `snapshot-about.json:8`
- **GitHub:** *not in any allowed source — null, see gaps*
- **LinkedIn:** *not in any allowed source — null, see gaps*

## Process (owner-approved, not sourced from the case studies)

> I take things apart until I understand them. Then I put them back together until they feel right.

---

## 1. Offpriced

- **id:** offpriced
- **kind [V]:** "B2B Wholesale Platform" — `case-study-wholesale.md:2`
- **for [P]:** Offpriced, a Montréal stocklot house selling clothing by the lot to retailers and wholesalers buying surplus, cancelled orders and factory over-runs in bulk. — `case-study-wholesale.md:23`
- **oneLine [V]:** "One app for buyers, staff and editors — with a site the owner updates by talking to an AI." — `case-study-wholesale.md:5`
- **slug:** b2b-wholesale-platform
- **caseStudyUrl:** https://www.rajatkumarr.com/projects/b2b-wholesale-platform
- **stack [V]:** Next.js, React, TypeScript, Payload CMS, PostgreSQL, Cloudflare R2, Resend, Vercel, Progressive Web Apps, Web Push, Model Context Protocol — `case-study-wholesale.md:7-17`

**Facts**
- [V] "direct from fifty-seven factories, trade only" — `:37`
- [V] "a single application serving four audiences: the public, signed-in buyers, the team working those deals, and whoever edits the site" — `:23`

**Problem [P]**
Deals were negotiated by email with no single record of what was promised, and because every lot is a one-off with no restock, a public site nobody in the business could edit quickly became stale and a liability. — `:27-29`

**Built**
1. [P] The public site — a shop window centred on "The Floor", the catalogue of lots currently available. — `:35-37`
2. [P] The buyer portal — line sheets, enquiries, quotes and orders tracked end to end instead of scattered across inboxes. — `:39-41`
3. [P] The internal operations app — a mobile-first CRM for staff to keep The Floor current and manage quotes and fulfilment. — `:43-45`
4. [P] The admin CMS, plus an MCP-based AI publishing flow so the owner can draft and publish articles by talking to Claude. — `:49-57`

**Decisions**
1. [P] Embedded Payload CMS in the same Next.js codebase rather than a second service, for one deployment and one login model instead of two systems to sync. — `:61`
2. [P] Built the MCP server as a small, fixed set of actions behind a secret token — specific controls for the AI, not open access. — `:57`
3. [P] Modelled the sales lifecycle end to end with an automatic email and permanent record at each transition, so a dispute is a lookup, not an argument. — `:63`
4. [P] Segregated push notifications by audience, so an internal alert never reaches a customer's phone. — `:47`
5. [P] Fixed the design system before building screens, so a new screen is assembly, not invention. — `:71`

**Outcome [V]**
"One system where there were several disconnected ones. Buyers self-serve instead of waiting on a reply, staff work deals from a phone, and the site is edited by the people who know what it should say. Every enquiry, quote and order has a trail. And the owner publishes by talking." — `:83`

**Architecture** (four audiences → one app → one database) — cite `:23`
- Nodes: The public · Signed-in buyers · The team working those deals · Whoever edits the site → One application → One database
- Edges: each of the four audiences → app; app → db ("one codebase, one database")

---

## 2. Staffing operations platform

- **id:** staffing
- **kind [V]:** "a small ERP, built from scratch" — `case-study-staffing.md:21`
- **for [P]:** a staffing company (client name withheld per naming rules) — `:21`
- **oneLine [V]:** "Five portals, one login, and every company's data walled off inside the database itself." — `:4`
- **slug:** staffing-operations-platform
- **caseStudyUrl:** https://www.rajatkumarr.com/projects/staffing-operations-platform
- **stack [V]:** Next.js, React, TypeScript, Turborepo, Drizzle ORM, PostgreSQL, Better Auth, CASL, Row-Level Security, State Machines — `:6-15`

**Facts**
- [V] "five relationships at once — its own team, the client companies, the people it places, the recruiters who source them, and the prospects it chases" — `:21`
- [V] "927 automated tests run against all of it." — `:69`

**Problem [V]**
"On spreadsheets, that produces the two failure modes that hurt: money that quietly leaks, and information reaching the wrong company. The requirement: one system, five doors into it, and doors that do not connect." — `:25`

**Built**
1. [P] Five portals — Admin, Client, Worker, Partner, and an Onboarding flow that converts a prospect into a client once money changes hands. — `:29-47`
2. [P] Permissions through CASL, precise enough to say a person may approve a specific record, not just that they hold a role. — `:61`
3. [P] A workflow engine of state machines for approvals, so a request can't skip a step. — `:63`
4. [P] An invoicing engine on integer minor-currency units with one written rounding rule, and an append-only audit log. — `:65-67`

**Decisions**
1. [P] Enforced tenant isolation as row-level security in the database itself, not application code — one forgotten filter can't leak another company's payroll. — `:53-55`
2. [P] Ordinary traffic runs through a deliberately powerless database account that cannot switch the checks off; a privileged account exists only for maintenance. — `:55`
3. [P] Stored money as whole numbers of the smallest currency unit, never binary floating point, which cannot represent most money amounts exactly. — `:65`
4. [P] Made the audit log append-only — rewriting history takes deliberate action through the maintenance account, not a quiet app edit. — `:67`
5. [P] Deliberately skipped the codebase knowledge graph used on another project — five portals over one shared core fits in one head. — `:73`

**Outcome [V]**
"Five groups, one platform, each seeing only its own slice. Work approved once and billed from the same record, commissions calculated rather than reconstructed, a history that cannot be quietly rewritten." — `:79`

**Architecture — walls, not five systems** — cite `:29-57`
- Walls note [P]: Each of the five portals connects into one shared core and one database; row-level security independently checks every read and write so one client company's rows cannot leak to another's.
- Nodes: Admin · Client · Worker · Partner · Onboarding → Shared core → Database (row-level security)
- Edges: each portal → core; core → db

---

## 3. lucif3r

- **id:** lucif3r
- **kind [V]:** "a website with one job — turn a tournament organiser or a brand's event manager into a booking enquiry" — `case-study-esports-talent.md:25`
- **for [P]:** lucif3r, an esports caster, stage host and broadcast voice working across esports finals, brand launches and live conventions. (Source reads "[lucif3r](url) is an esports caster, stage host...": the name is de-linked here.) — `:25`
- **oneLine [V]:** "A booking site that feels like a live broadcast — kept current by the talent, not a developer." — `:5`
- **slug:** esports-talent-portfolio
- **caseStudyUrl:** https://www.rajatkumarr.com/projects/esports-talent-portfolio
- **stack [V]:** Next.js, React, TypeScript, Payload CMS, PostgreSQL, Tailwind CSS, Lenis, Vercel Blob, Resend, Cloudflare Turnstile, Vitest, Playwright, Vercel — `:7-19`

**Facts**
- [V] "The audience was written down before anything was designed: tournament organisers and esports organisations first, then brand and event managers, then sponsors." — `:33`
- [V] "Success is measured in qualified enquiries, not pageviews." — `:33`
- [V] "a near-black ground, warm off-white type, one magenta accent, and gold kept for numbers and highlights" — `:41`

**Problem [P]**
Generic talent sites and link-in-bio pages don't sell a broadcaster, and the site needed to turn organisers, brand managers and sponsors into booking enquiries, with content the talent could keep current without a developer for each new event. — `:29-35`

**Built**
1. [P] A broadcast-style design system — near-black ground, one magenta accent, gold for highlights, square corners by rule, a film-grain texture layer. — `:41`
2. [P] Motion with a reduced-motion off switch: a glitching wordmark, a gold shimmer, a ticker, smoothed scrolling. — `:45-52`
3. [P] A home page built around one path to the booking form, with a bento grid of past events and a gallery. — `:54-58`
4. [P] A custom Control Room on top of embedded Payload CMS, with live preview, draft/publish, and editable brand colours. — `:66-77`

**Decisions**
1. [P] Kept all effects to plain CSS plus one small scrolling library, so nothing heavy downloads before the page comes alive. — `:52`
2. [P] Gave mobile its own layout rather than a squeezed desktop one — a booking often starts on a phone. — `:63`
3. [P] Settled the look through two HTML prototypes rather than debating directions; removed a custom cursor once the grain layer supplied the same depth. — `:91`
4. [P] Validated the booking form in the browser and again on the server against the same rules; Cloudflare Turnstile keeps bots out. — `:60`
5. [P] Kept analytics and Speed Insights on the public site only, never inside the Control Room. — `:83`

**Outcome [V]**
"A site that looks like the job: broadcast energy from the first frame, proof of the stages already worked, and a booking form at the end of every path. It stays current because the talent keeps it current — new events, new photos, even new colours — without waiting on anyone." — `:103`

**Architecture — public site + control room → live pages** — cite `:68-77`
- Nodes: Control Room (Payload CMS) · PostgreSQL · Live pages
- Edges: Control Room → PostgreSQL (stores content); Control Room → Live pages (publish); PostgreSQL → Live pages (serves)

---

## 4. Tredye

- **id:** tredye
- **kind [V]:** "Real-Time NSE Market Monitoring on an Event-Driven Stack" — `case-study-tredye.md:2`
- **for [V]:** "built for Voltvave Innovations" — `:27`
- **oneLine [V]:** "Roughly 800 live RSI streams, divergence alerts and MACD setups — computed as the market moves and streamed to the browser." — `:5`
- **slug:** tredye-trading-platform
- **caseStudyUrl:** https://www.rajatkumarr.com/projects/tredye-trading-platform
- **stack [V]:** Python, FastAPI, Apache Kafka, Redis, PostgreSQL, TA-Lib, Kite Connect, Next.js, React, TypeScript, Tailwind CSS, WebSockets, Docker, Nginx, Razorpay — `:7-21`

> Tredye is market **monitoring**, not a trading platform. Nothing below mentions signals, advice, win rate, Sharpe ratio or P&L — see gaps for what that excluded from the source.

**Facts**
- [V] "around 200 NSE stocks on four intraday timeframes at once" — `:27`
- [V] "roughly 800 charts. Nobody watches 800 charts." — `:33`
- [V] "Kafka 4.1 runs in KRaft mode — no ZooKeeper to operate" — `:107`
- [V] "Every two seconds it reads the live board from Redis and pushes it to every connected client" — `:101`

**Problem [P]**
A divergence between price and RSI can form and dissolve within a quarter of an hour, and across roughly 200 stocks on four timeframes that is about 800 charts — more than anyone can watch by eye — so the watching had to move off the screen and into a system. — `:33-35`

**Built**
1. [P] A live monitoring board showing RSI across four timeframes per stock, with divergence highlighting and search. — `:41-43`
2. [P] A divergence history view, filterable by stock, timeframe, type and confidence. — `:47`
3. [P] A MACD strategy view showing daily market bias and the setups/triggers that follow on shorter timeframes. — `:48`
4. [P] Accounts and subscriptions with phone-verified sign-up, Razorpay payments, and an admin console. — `:51`

**Decisions**
1. [P] Aligned candles to the 9:15 IST market open rather than the Unix clock, so a 15-minute candle matches a charting terminal's. — `:95`
2. [P] Backfilled months of history on start-up, then gated the detectors behind a warm-up announcement on Kafka for up to half an hour. — `:97`
3. [P] Consolidated candle history onto PostgreSQL instead of the dedicated time-series database the original blueprint specified — one fewer datastore. — `:115`
4. [P] A single FastAPI gateway holds one WebSocket per browser, pushing the live board from Redis every two seconds rather than on every tick. — `:101`
5. [P] Compiled TA-Lib once in a shared Docker build stage, with each service a thin target on top. — `:111`

**Outcome [V]**
"Tredye keeps roughly 800 live RSI streams current through an event-driven pipeline and surfaces the patterns worth a second look while they still matter — on a phone or at a desk, from the opening bell to the close. Each stage runs in its own container, and subscriptions, payments and an admin console are built in." — `:125`

**Architecture — the case study's own flow block, lines 65–91, 9 nodes (at the ≤9 limit)**
*Legend line omitted — it uses "signals", a term barred by the naming rules for this project.*

```
Kite Connect --WebSocket--> Data ingestion --Kafka·ticks--> Candle builder
Candle builder --Kafka·candles--> RSI calculator --Kafka·RSI--> Divergence detector
Candle builder --Kafka·candles--> MACD calculator --Kafka·MACD--> MACD strategy detector
Divergence detector --Kafka·alerts and setups--> API gateway
MACD strategy detector --Kafka·alerts and setups--> API gateway
API gateway --WebSocket--> Next.js dashboard
```

---

## Timeline (newest first) — `experience-timeline.tsx`

| Org | Role | Dates | Line |
|---|---|---|---|
| Independent | Freelance Software Architect & Developer | Feb 2026 - Present | [V] "Building full-stack web platforms for clients end to end — B2B commerce and CRM, multi-portal operations software and motion-led brand sites — with Next.js, Payload CMS and PostgreSQL." `:22` |
| Voltvave Innovations | Freelance Software Architect & Developer | Nov 2025 - Jan 2026 | [V] "Built \"Tredye\", a real-time market-monitoring platform for NSE stocks: Python services on Kafka, Redis and PostgreSQL, with a Next.js dashboard. Built the event-driven data pipeline, alerts and backtesting." `:31` |
| Red Education | Team Lead, Senior Python Support Engineer | Feb 2024 - Aug 2025 | [V] "Engineered Labbuild 2.0 achieving 90% faster performance" `:40` |
| Freelancer | Technical Consultant | Nov 2023 - Jan 2024 | [V] "Developed Django/PostgreSQL/Svelte dashboard solutions" `:51` |
| Offpriced Canada Inc. | Senior Developer | Jul 2022 - Oct 2023 | [V] "Led team of 6 developers" `:61` |
| HCL Technologies | Lead Engineer SQA | Oct 2021 - Jun 2022 | [V] "Worked with Palo Alto Networks" `:72` |
| SERC, IISc | System Engineer | Jul 2019 - Sep 2021 | [V] "Managed SahasraT supercomputer (33,000 cores) - India's fastest supercomputer" `:83` |
| TEKsystems/HPE | Network Support Engineer | Jun 2017 - Jun 2019 | [V] "Provided AT&T L1 support" `:93` |

*Note: "Freelance Software Architect & Developer" for the Voltvave role is the exact title used in the source for both the Independent and Voltvave rows — confirmed against `snapshot-about.json:59,67` as well.*

---

## Gaps

1. **person.github / person.linkedin** — not present in any allowed source (`snapshot-about.json`, the four case studies, or `experience-timeline.tsx`). The task brief supplied `https://github.com/rajat157` and `https://www.linkedin.com/in/rajat-kumar-r` directly, but per the "nothing invented" rule these are recorded as `null` in `content.json` rather than asserted as sourced facts. Confirm with the owner before either design study uses them.
2. **Tredye backtesting metrics** — `case-study-tredye.md:49` mentions win rate, profit factor, Sharpe ratio and maximum drawdown as part of the backtesting feature. Omitted from facts/built/outcome because the task's hard rules forbid writing "win rate" or "Sharpe ratio" for this project.
3. **Tredye flow-block legend** — `case-study-tredye.md:89` uses the word "signals", barred by the naming rules for this project. Dropped from the architecture extraction rather than edited (editing a verbatim source line would itself be a kind of invention).
4. **No "Decisions" heading exists** in any case study. All 3–5 decisions per project were paraphrased from narrative prose, as the task instructed — every decision is `verbatim: false` by construction, each cited to the specific sentence it came from.
5. **experience-timeline.tsx vs. snapshot-about.json** — identical experience data in both. `experience-timeline.tsx` (listed first in the allowed sources, and the one with "timeline structure") was used as the cite source; `snapshot-about.json` content matches and was used only to cross-check the Voltvave role title.
6. **No quantified business outcome** (revenue, conversion rate, time saved) is stated anywhere for any of the four projects beyond the qualitative "## The result" paragraphs quoted verbatim in each `outcome` field.
7. Education, skills, interests and `resume_url` from `snapshot-about.json` were not requested `person` fields — left out by scope, not a gap.
