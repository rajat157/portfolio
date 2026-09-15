<!-- CMS METADATA — DO NOT PASTE BELOW THIS LINE INTO THE CONTENT FIELD -->
title: "Tredye — Real-Time NSE Market Monitoring on an Event-Driven Stack"
slug: tredye-trading-platform
live_url: https://tredye.com
description: "Roughly 800 live RSI streams, divergence alerts and MACD setups — computed as the market moves and streamed to the browser."
technologies:
  - Python
  - FastAPI
  - Apache Kafka
  - Redis
  - PostgreSQL
  - TA-Lib
  - Kite Connect
  - Next.js
  - React
  - TypeScript
  - Tailwind CSS
  - WebSockets
  - Docker
  - Nginx
  - Razorpay
category: web-dev
<!-- END METADATA — CASE STUDY CONTENT STARTS BELOW -->

# Tredye — Real-Time NSE Market Monitoring on an Event-Driven Stack

[Tredye](https://tredye.com) is a real-time market-monitoring platform for Indian equities, built for Voltvave Innovations. It watches around 200 NSE stocks on four intraday timeframes at once, keeps momentum indicators current as the market moves, flags RSI divergences and multi-timeframe MACD setups as they form, and streams it all to the browser — no refreshing, no flipping between charts.

Most of the work in this portfolio is about workflow and content. Tredye is about data in motion: a pipeline that has to stay correct at market speed, every trading day.

## The problem

The patterns market watchers look for are fleeting. A divergence between price and RSI on a 5-minute chart can form and dissolve inside a quarter of an hour. Noticing one means watching the right stock, on the right timeframe, at the right moment — and across some 200 stocks and four timeframes, that is roughly 800 charts. Nobody watches 800 charts.

So the watching had to move off the screen and into a system: one that computes every indicator continuously on the server, recognises the patterns worth flagging, and shows the result on a single screen.

That system has hard constraints. Market data arrives as an unbroken stream of ticks. Indicators need history before their values mean anything. Candles have to line up with the exchange's clock, not a server's. And the whole thing has to come back cleanly the next morning.

## What was built

### A live monitoring board

The dashboard is a single board of every tracked stock. Each row shows live RSI on the 5, 15, 30 and 60-minute timeframes, changes colour as a stock moves into overbought or oversold territory, and carries a price sparkline. When a divergence appears, its cell lights up — a confirmed divergence with a solid, glowing border, one still forming with a dashed outline. Search narrows the board as you type.

Beyond the board:

- **Divergence history** — every confirmed divergence, filterable by stock, timeframe, type and confidence, with reference levels and a position-size calculator in each expanded row.
- **MACD strategy view** — daily market bias, setups on the four-hour chart, and the hourly triggers that follow them.
- **Backtesting** — replay the strategy over history with your own parameters and capital, and read the outcome as an equity curve, a drawdown chart, a monthly-returns heatmap and a trade-by-trade list, alongside win rate, profit factor, Sharpe ratio and maximum drawdown.
- **Market news** — headlines gathered into one feed, tagged by keyword and scored for sentiment.
- **Accounts and subscriptions** — phone-verified sign-up, paid plans through Razorpay, and an admin console for users, payments, subscriptions and feedback.

The product carries a monitoring-tool disclaimer: a consent notice on its public pages, full disclaimer and terms pages, and a notice on the divergence history.

### Designed to be glanced at

A monitoring board is read in seconds, so the interface is built for glancing. The canvas is pure black with a single red brand accent, and colour carries meaning — overbought and oversold, bullish and bearish, up and down. Prices and indicators are set in a monospace face, so columns of changing numbers stay aligned.

Live data raises its own design questions. A status badge shows whether the market is open and whether the live connection is up, so a dropped connection is visible at a glance. Signing in on another device ends the old session straight away, with a message saying why. The board is virtualised — only the rows on screen are rendered — so it stays responsive while it updates, on a phone as well as a desktop. On smaller screens the sidebar folds away and each stock stacks into a compact card.

## System design

Tredye is a set of small services connected by events. Market data flows through them in one direction, from the broker's feed to the browser.

```text
        Kite Connect live feed
                  │
                  ▼
           data ingestion
                  │  Kafka: ticks
                  ▼
           candle builder
                  │  Kafka: candles
          ┌───────┴────────┐
          │                │
   RSI calculator   MACD calculator
   (writes Redis)          │
          │                │
     divergence      MACD strategy
      detector          detector
          │                │
          └───────┬────────┘
                  │  Kafka: alerts and setups
                  │  Redis: live board, every 2 s
                  ▼
    API gateway (REST + WebSocket)
                  │
                  ▼
          Next.js dashboard
```

**Ingestion.** One service holds the live WebSocket feed from Zerodha's Kite Connect and publishes every tick to Kafka. It follows NSE market hours, and reconnects on its own, fetching a fresh access token when the broker rejects the old one.

**Candles on the exchange's clock.** The candle builder turns ticks into candles from five minutes up to a day, aligned to the 9:15 IST market open rather than the Unix clock — so a 15-minute candle on Tredye matches the one on a charting terminal. While a candle is still forming, updates go out on a meaningful price move or every 30 seconds: live enough to watch, without flooding everything downstream.

**Indicators that warm up first.** On start, the RSI and MACD calculators backfill months of history from the broker, capping concurrent requests and retrying with backoff. RSI is then recomputed with TA-Lib over a rolling window of recent closes on every update, with each stream's latest state kept in Redis. When warm-up is done the calculators announce it on Kafka: the divergence detector waits for the RSI announcement, and the MACD strategy detector for the MACD one — for up to half an hour — before they start looking.

**Alerts, recorded.** Detectors publish divergence alerts, MACD setups and their hourly triggers over Kafka the moment they fire, and stale setups and divergences time out of the live view. Confirmed divergences are stored in PostgreSQL, where a uniqueness rule on each pivot keeps the history free of duplicates, even across restarts.

**From the pipeline to the browser.** A single FastAPI gateway serves the REST API the pages load from and holds one WebSocket per browser. Every two seconds it reads the live board from Redis and pushes it to every connected client, and alerts arriving over Kafka go out the moment they land.

**Everything around the pipeline.** Separate FastAPI services handle authentication, payments and subscriptions, news, backtesting and broker tokens, all behind the gateway. Kafka carries control messages too — which instruments to follow, and which sessions to end — so a new sign-in closes the user's other connections at once, and a role change or a deleted account closes all of them.

## How it was built

The backend is Python 3.12 on asyncio: FastAPI for the services, aiokafka and async Redis for streaming, SQLAlchemy over PostgreSQL 16, and TA-Lib for the indicator maths. Kafka 4.1 runs in KRaft mode — no ZooKeeper to operate — with compressed messages and short retention on raw ticks.

The frontend is Next.js 16 with React 19 and TypeScript, styled with Tailwind CSS v4 and shadcn/ui, with Recharts for the backtest charts, react-hook-form and Zod for validated forms, and TanStack Virtual for the live board.

One multi-stage Dockerfile builds every Python service: TA-Lib is compiled once in a shared stage, and each service is a thin target on top. Docker Compose profiles start exactly what a task needs — the infrastructure, the APIs, the data pipeline, or everything — with a hot-reload overlay for development. In production, Nginx fronts the stack behind Cloudflare, handling TLS, WebSocket upgrades, API routing, payment webhooks and request rate limits. Load scenarios are scripted with Locust.

## Built with AI, end to end

**A blueprint for the core pipeline.** The core pipeline is specified in a single blueprint — the data flow, the first Kafka topics and their message shapes, the Redis key schema — which the build then outgrew. The blueprint put candle history in a dedicated time-series database; the build consolidated on PostgreSQL, one fewer datastore to run.

**A project guide the AI reads first.** A project guide records the start-up order, the topics and the details that are easiest to break — market-open alignment and warm-up gating — so AI working sessions start from documented rules rather than a guess.

**AI in the commit history.** Around six in ten commits were co-authored with Claude.

I built most of the services, the event pipeline and the dashboard, working alongside another developer. AI made me faster. It did not work unsupervised.

## The result

Tredye keeps roughly 800 live RSI streams current through an event-driven pipeline and surfaces the patterns worth a second look while they still matter — on a phone or at a desk, from the opening bell to the close. Each stage runs in its own container, and subscriptions, payments and an admin console are built in.

## Building something similar?

If your product runs on live data — market feeds, telemetry, tracking, anything where the value is in reacting fast — the same event-driven pattern applies. [Get in touch](/contact) and tell me what needs to happen in real time.
