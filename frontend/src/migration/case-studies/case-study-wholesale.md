<!-- CMS METADATA — DO NOT PASTE BELOW THIS LINE INTO THE CONTENT FIELD -->
title: "B2B Wholesale Platform — Buyer Portal, CRM & CMS in One App"
slug: b2b-wholesale-platform
live_url: https://www.offpriced.com
description: "One app for buyers, staff and editors — with a site the owner updates by talking to an AI."
technologies:
  - Next.js
  - React
  - TypeScript
  - Payload CMS
  - PostgreSQL
  - Cloudflare R2
  - Resend
  - Vercel
  - Progressive Web Apps
  - Web Push
  - Model Context Protocol
category: web-dev
<!-- END METADATA — CASE STUDY CONTENT STARTS BELOW -->

# B2B Wholesale Platform — Buyer Portal, CRM & CMS in One App

[Offpriced](https://www.offpriced.com) sells clothing by the lot — not to shoppers but to the trade: retailers and wholesalers buying surplus, cancelled orders and factory over-runs in bulk. The Montréal stocklot house needed one system instead of five. What replaced them is a single application serving four audiences: the public, signed-in buyers, the team working those deals, and whoever edits the site. One codebase, one database, one place the truth lives.

## The problem

Wholesale runs on back-and-forth. A buyer asks about a lot. Someone checks. A price gets agreed in an email thread. Goods move. The record of what was promised ends up in one person's inbox, and the public site says something different because nobody has had time to update it.

Stocklot makes that sharper. Every lot is a one-off — a particular batch, in particular sizes, that exists once and is then gone. No reorder, no restock, no stable catalogue to build a shop around. Whatever the site says has a shelf life of weeks, which is why a site nobody inside the business can edit becomes a liability.

The fix had to work from both ends — real self-service for buyers, and something genuinely faster than the email thread for staff, because anything slower than the old way does not get used.

## What was built

### The public site

The shop window, and for most buyers the first sales conversation. Its centre is **The Floor**: Offpriced's own name for the catalogue of lots currently available, borrowed from the warehouse floor where those lots physically sit. Buyers browse it by type — stocklot, engineered, blanks — alongside the operation pages, a journal of trade articles, and how to make contact. Offpriced's public line for itself, "direct from fifty-seven factories, trade only", sits on that site too.

### The buyer portal

B2B prices are negotiated, not printed, and the portal is built around that. A signed-in buyer works The Floor and adds lots to a **line sheet** — the trade's term for the shortlist a buyer assembles to price up, and here a formatted PDF in one click. From there: raise an enquiry, receive a quote, accept it, follow the order through to delivery — the whole thread attached to the record instead of scattered across inboxes.

### The internal operations app

The team gets its own app, installable on a phone straight from the browser with no app store involved: keep The Floor current as lots land and sell out, answer enquiries, issue quotes, track fulfilment. This is the CRM half of the system, deliberately mobile-first because that is where the work happens.

Buyers get their own installable app too, and notifications are segregated by audience — an internal alert about a deal or a late shipment reaches internal phones, never a customer's.

### The admin CMS

Every page of the public site is editable by the business — not only the journal but the home page, the section pages, the copy and the images, each a plain form. Nobody books developer time to change a headline.

### Publishing by talking to an AI assistant

The business owner can create, review, edit and publish an article by talking to Claude in plain English. No CMS login, no form: they describe what they want to say, the assistant drafts it, they refine it in conversation, they say publish, and the live site updates moments later.

Underneath is a custom MCP server — the controls an AI assistant may operate on the site's behalf: a deliberately small, fixed set of actions and nothing else, behind a secret token. The point is not novelty, but that the busiest person in the business can publish an idea while it is still fresh, from wherever they are.

## How it was built

One application, not a stack of separate systems bolted together. Next.js 16 and React 19 for the site and the apps, with Payload CMS embedded in the same codebase rather than run as a second service: one deployment, one login model, nothing to keep in sync. PostgreSQL holds the data, Cloudflare R2 the files and images, Resend the email, and all of it runs on Vercel.

The sales lifecycle — enquiry, quote, order, delivery — is modelled end to end, with an automatic email at each transition and a permanent record of every message sent. When a buyer says "I never got that quote", the answer is a lookup, not an argument.

## Built with AI, end to end

AI was used across the whole lifecycle here, not as autocomplete.

**Specification before code.** Four audiences with four sets of permissions is cheap to get wrong on paper and expensive to get wrong in a database. Requirements were argued out in conversation and written up as a document first.

**A design system before screens.** Colour, type and spacing were fixed up front, so a public page, a buyer screen and a staff screen inherit the same decisions and a new screen is assembly, not invention.

**Tiered review.** Routine work goes to fast, cheap models; architecture, security and anything touching a price goes to the strongest available. A separate adversarial pass then runs with one job: find what is wrong before it ships.

**A knowledge graph of the codebase.** This project keeps a queryable map of itself — files, functions and the connections between them — which the AI consults before making a change, so work in one corner stops quietly breaking another. It was built for this codebase in particular, not as standard equipment.

**Written decision records.** Every significant choice is logged with its reasoning, including what was deliberately not built and what would make it worth building.

I wrote the brief, made the calls, reviewed the design and every path that touches a price or a customer's data, and I am accountable for what shipped. AI made me faster and more consistent. It did not work unsupervised.

## The result

One system where there were several disconnected ones. Buyers self-serve instead of waiting on a reply, staff work deals from a phone, and the site is edited by the people who know what it should say. Every enquiry, quote and order has a trail. And the owner publishes by talking.

## Building something similar?

If you run a business where deals live in inboxes and the website is always slightly out of date, this pattern transfers — the sector matters much less than the shape of the problem. [Get in touch](/contact) and tell me what your version looks like.
