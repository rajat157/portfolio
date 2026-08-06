<!-- CMS METADATA — DO NOT PASTE BELOW THIS LINE INTO THE CONTENT FIELD -->
title: "Staffing Operations Platform — Five Portals on One System"
slug: staffing-operations-platform
description: "Five portals, one login, and every company's data walled off inside the database itself."
technologies:
  - Next.js
  - React
  - TypeScript
  - Turborepo
  - Drizzle ORM
  - PostgreSQL
  - Better Auth
  - CASL
  - Row-Level Security
  - State Machines
category: web-dev
<!-- END METADATA — CASE STUDY CONTENT STARTS BELOW -->

# Staffing Operations Platform — Five Portals on One System

A staffing business runs on five relationships at once — its own team, the client companies, the people it places, the recruiters who source them, and the prospects it chases. Each needs a different view of the same facts; none should see the others'. One login, one permission model, one workflow engine — a small ERP, built from scratch.

## The problem

Staffing is an administrative business wearing a sales business's clothes. Somebody placed somebody, work was done and signed off, an invoice went out and was paid, commission was owed to whoever sourced it. Every step is a handoff to someone who should see only part of the picture. On spreadsheets, that produces the two failure modes that hurt: money that quietly leaks, and information reaching the wrong company. The requirement: one system, five doors into it, and doors that do not connect.

## What was built

### Admin — where the business is run

People and placements, client companies, commission rules, invoicing, approvals — anything needing a decision surfaces here.

### Client — the hiring company's view

Each client sees its own workforce, invoices and documents — and signs off work here, inside the system that will bill for it, so approved and invoiced are one record, not two someone reconciles later.

### Worker — the placed candidate's view

Pay history, profile and documents, messages, and new roles they can put themselves forward for — the questions people would otherwise phone the office to ask, which is how a small operations team stays small.

### Partner — the recruiter's view

Placements sourced, commission earned, what is in the pipeline. People source better when they can see their own numbers without asking for a report.

### Onboarding — turning a prospect into a client

A guided sign-up that walks a prospective client through everything needed to start working together, then converts them into a client account by itself once money changes hands.

## Keeping every company's data separate

Many separate organisations share this one system, and each can only ever see its own data. Easy to claim, hard to do properly — so it was done at the strongest layer available.

Most systems enforce it in application code: every query remembers to filter by company. That works right up until one query forgets, and then one company sees another's payroll.

Here the rule lives in the database itself, as row-level security: on every read and write it independently checks that the rows belong to the organisation asking, and refuses otherwise. Ordinary traffic runs through a deliberately powerless account that cannot switch those checks off; a separate privileged account exists only for maintenance. A connection that has not declared which organisation it is acting for gets nothing at all: deny by default, rather than accidentally handing over everything.

So a whole class of everyday application bugs — the forgotten filter, the endpoint added in a hurry — cannot leak one company's data to another: the check does not depend on that code being correct. It is not a magic shield; the application still has to declare which organisation it is acting for, and that declaration is code like any other. What changes is the default: nothing comes back unless the database has independently agreed it should, and tests try to cross the boundary on every build.

## How it was built

All five portals are Next.js 16 and React 19 in a monorepo — one repository where they share common parts instead of drifting into five near-copies of the same logic. Permissions run through CASL, precise enough to say "this person may approve this record", not just "this person is a manager".

**The workflow engine.** Approvals and multi-step processes are state machines: a named set of states, and the only moves permitted between them. A request cannot skip a step, and changing a process happens in one place.

**The invoicing engine.** Money is held as whole numbers of the smallest currency unit, never as binary floating point, which cannot represent most money amounts exactly and drifts as the errors accumulate. Rounding happens once, under one written rule — and it is that rule, not the storage, that makes an invoice total agree with the sum of its lines.

**The audit log.** Append-only: the account the application runs under may add entries and cannot alter or remove them. Rewriting history takes deliberate action through the maintenance account — not a bug, not a quiet edit from inside the app.

Invoices generate as PDFs, exports as Excel. 927 automated tests run against all of it.

## Built with AI, end to end

The permission model — five portals multiplied by what each may see and do — was settled as a written specification before code, where a mistake costs a paragraph, not a migration. Routine implementation went to fast, cheap models; anything touching permissions or money went to the strongest available, then to an adversarial pass whose only job is finding what is wrong before it ships. The 927 tests are its residue: the isolation tests exist because a review asked what happens when the organisation is never declared. One thing is deliberately absent: the codebase knowledge graph I maintain for another project. Five portals over one shared core is a structure you can keep in your head.

None of this means AI built it unattended. I set the direction, made the hard calls, reviewed the architecture and every path touching money or tenancy, and I am accountable for the result.

## The result

Five groups, one platform, each seeing only its own slice. Work approved once and billed from the same record, commissions calculated rather than reconstructed, a history that cannot be quietly rewritten.

## Building something similar?

If several parties each need their own view of shared data — and one seeing another's would be a serious problem — this is the shape of the answer. [Get in touch](/contact).
