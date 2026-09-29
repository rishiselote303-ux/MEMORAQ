# MEMORAQ

> Remember the past. Understand the present. Simulate the future. Let humans decide.

A **Memory-Augmented Strategic Intelligence and Decision-Simulation platform**. It connects a persistent organizational memory (self-hosted [Hindsight](https://github.com/vectorize-io/hindsight)), a deterministic six-month financial engine, competitor intelligence, and a what-if strategy simulator — so that humans make better-informed strategic decisions.

**Positioning:** not "an AI chatbot for businesses" — a persistent strategic intelligence system: **REMEMBER → UNDERSTAND → SIMULATE → EXPLAIN → DECIDE → LEARN → REMEMBER**.

---

## Problem

Organizations forget. Decisions are made, outcomes land in spreadsheets, and the reasoning evaporates. Six months later the same pricing debate restarts from zero — with no evidence of what happened last time, no memory of why similar strategies succeeded or failed, and no structured way to bring history into the room.

## Solution

A single system that:

1. **Remembers** — every decision, outcome, observation, lesson and competitor event is retained into persistent memory banks.
2. **Understands** — a deterministic engine computes six months of KPIs, derived metrics, and annotated anomalies ("Revenue declined 11.4% in Month 4 while marketing expenditure increased 8.2%").
3. **Simulates** — a deterministic what-if engine projects revenue/costs/profit/margin for scenario levers (price, discount, marketing, volume, payroll) — never the LLM.
4. **Explains** — AI interpretation is grounded in recalled memory; every insight carries a "Why?" affordance showing labeled evidence: Historical Fact / Current Data / Simulation / AI Interpretation / Hypothesis / Assumption.
5. **Decides** — the AI never executes anything. Strategy Briefs end with a human decision gate; chosen decisions are retained back into memory.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    React + Vite frontend                     │
│  Financial Journey · Strategic Radar · Strategy Canvas ·     │
│  Competitor Monitor · Decision Memory · Memory Inspector ·   │
│  Executive AI · Strategy Brief                               │
└──────────────┬───────────────────────────────────────────────┘
               │  reactive queries + actions
┌──────────────▼───────────────────────────────────────────────┐
│                Orchestration layer (Convex)                  │
│                                                              │
│  api.ts        queries/mutations — dashboard, financials,    │
│                competitors, chat, memory summary             │
│  actions.ts    node actions — ingest, ask, simulate, brief   │
│  agent.ts      question classification, memory retrieval     │
│                decisions, evidence aggregation, briefs       │
│  financials.ts deterministic KPIs, anomalies (pure)          │
│  simulation.ts deterministic what-if engine (pure)           │
│  mockdata.ts   six-month dataset, decisions, competitor data │
└──────────────┬───────────────────────────────────────────────┘
               │  official SDK: @vectorize-io/hindsight-client
┌──────────────▼───────────────────────────────────────────────┐
│           hindsight_client.ts  (retain/recall/reflect)       │
└──────────────┬───────────────────────────────────────────────┘
               │  HTTP :8888 (no API key)
┌──────────────▼───────────────────────────────────────────────┐
│              HINDSIGHT SERVER  (self-hosted)                 │
│                                                              │
│  Bank: northwind-experience          Bank: northwind-world   │
│  ├─ decisions + rationale            ├─ competitor events    │
│  ├─ expected vs actual outcomes      ├─ pricing changes      │
│  ├─ management observations          ├─ launches, campaigns  │
│  ├─ lessons learned                  └─ market context       │
│  └─ executive conversation                                    │
└──────────────────────────────────────────────────────────────┘
```

### Why Hindsight is the memory spine (not the whole brain)

| Concern | Owner |
|---|---|
| Remember / retrieve / connect / synthesize experience | **Hindsight** |
| KPI math, simulations, competitor event processing | **Deterministic code** |
| Interpretation, explanation, strategic briefing | **LLM via Hindsight `reflect`** |
| Final decision | **Human** |

The LLM never computes financial numbers. Simulated values are labeled **Simulation**, never prediction; uncertain future competitor actions are labeled **Hypothesis** with evidence and confidence.

---

## Hindsight role

### Experience Memory (`northwind-experience`)
The organization's own history: decisions (D-101…D-204) with situation → options → chosen action → reason → expected vs actual outcome → financial impact → lesson; management observations; the executive strategy conversation.

### World Memory (`northwind-world`)
External strategic context: competitor pricing moves, launches, promotions, announcements, partnerships, and market context — extracted from (mock) public sources only.

### The three operations, visibly used
- **RETAIN** — demo ingest writes 20+ records into the two banks (decision + outcome records, observations, conversation, competitor events, market context). Every panel action that records a decision performs a real retain.
- **RECALL** — every executive question and every simulation retrieves similar historical decisions/experiments with timestamps and context.
- **REFLECT** — the Executive AI and Strategy Brief run Hindsight's agentic reflect (with `includeFacts`) so answers cite the memories they were built from.

### Honest fallback mode
If the self-hosted server is unreachable, the app **still works**: operations are served from a labeled local fallback store and every affected row in the Memory Inspector and every affected answer is marked **FALLBACK**. Nothing pretends to be live Hindsight.

---

## Data flow (one question)

```
Executive question
  → classify intent (agent.ts)
  → RECALL experience bank (+ world bank for competitor questions)
  → deterministic engine computes any needed current values
  → SIMULATE (only when the question asks "what if …%")
  → REFLECT over the right bank (LLM explains using memory + given numbers)
  → answer + labeled evidence + operations trace
  → human decides → decision + outcome RETAINed back into memory
```

---

## Setup

### 1. Local Hindsight (self-hosted, no API key for Hindsight itself)

Hindsight needs an LLM for retain/reflect extraction. Using OpenAI as an example:

```bash
# Option A — Docker (recommended)
export OPENAI_API_KEY=sk-xxx
docker run -it --pull always --name hindsight --restart unless-stopped \
  -p 8888:8888 -p 9999:9999 \
  -e HINDSIGHT_API_LLM_API_KEY=$OPENAI_API_KEY \
  -v hindsight-data:/home/hindsight/.pg0 \
  ghcr.io/vectorize-io/hindsight:latest
# API: http://localhost:8888 · Control-plane UI: http://localhost:9999

# Option B — bare metal
pip install hindsight-api
export HINDSIGHT_API_LLM_API_KEY=sk-xxx
hindsight-api
```

Hindsight supports 25+ LLM providers including fully local ones (Ollama, LM Studio, llama.cpp) — see the [supported models](https://hindsight.vectorize.io/developer/models) page. The app itself never needs a Hindsight Cloud account or key. If you run the server elsewhere, set `HINDSIGHT_BASE_URL` (server-side env var, default `http://localhost:8888`).

### 2. Backend + frontend

```bash
bun install
bun convex dev --once   # push Convex functions + generate types
bun run dev             # start Vite
```

Sign in (email OTP or guest), open `/dashboard`. On first load the app ingests the demo organization: decisions are recorded and both Hindsight banks are seeded. Watch the **Memory Inspector** — each row is a real operation.

---

## API overview

| Endpoint | Type | Purpose |
|---|---|---|
| `api.actions.health` | action | Hindsight connectivity probe (`/version` on the self-hosted server) |
| `api.api.dashboard` | query | Company, KPI months, totals, anomalies, timeline, decisions, competitors, hypotheses |
| `api.api.financials` | query | Six-month deterministic financials |
| `api.api.competitors` | query | Competitors, events, evidence-backed hypotheses |
| `api.actions.ingest` | action | Seed decisions + retain all demo records into both memory banks |
| `api.actions.ask` | action | Executive question → classify → recall → simulate (if asked) → reflect → labeled evidence |
| `api.actions.simulate` | action | Deterministic what-if + Hindsight recall of similar historical experiences |
| `api.actions.retainDecision` | action | Retain a decision record (+ outcome) into experience memory |
| `api.actions.buildBrief` | action | Full Strategy Brief (facts / assumptions / simulations labeled) |
| `api.api.listChat` / `clearChat` | query/mutation | Executive AI transcript |
| `api.memory.listActivity` | query | Live memory-activity feed (drives the Memory Inspector) |

---

## Demo flow (10 minutes)

1. **Open the dashboard** — the Six-Month Financial Journey renders automatically; the KPI strip shows the window totals.
2. **Read the anomaly banner** — "In Jun 2026, revenue declined 11.4% while marketing spend increased 8.2% …" (deterministic detection, labeled *Current Data*).
3. **Open the Memory Inspector** — see the seeded Experience and World banks (RETAIN rows, expandable sources).
4. **Ask:** *"What happened the last time we reduced Product A's price?"* — RECALL + REFLECT operations stream into the Memory Inspector; the answer cites D-101 (5% cut → volume up 6.8%) and D-102 (10% cut → margin anchored lower).
5. **Drag the price lever to -7%** in the Strategy Canvas — the deterministic engine projects revenue/profit/margin deltas while Hindsight recall lists the comparable historical experiments. Assumptions (elasticity calibration, no-competitor-response) are one click away.
6. **Open the Competitor Monitor** — Apex's May promotion → June -8% → August -12% cadence is on the timeline; hypotheses are labeled *Hypothesis* with evidence and confidence.
7. **Ask:** *"How should we interpret Apex's recent price reduction?"* — world memory + experience memory + current data combine in one answer.
8. **Generate the Strategy Brief** — executive summary through AI hypotheses, every section carrying its data-source label, ending in the human decision gate.
9. **Decide** — nothing executes automatically.
10. **Retain the decision** — Decision Memory → "Retain" writes the decision + outcome into Hindsight; the learning loop closes in front of the jury.

---

## Engineering discipline

- No hard-coded AI answers: the LLM is only reached through Hindsight `reflect`, over real retained memory.
- No fake memory: the Memory Inspector renders rows written exclusively by actual backend operations; fallback mode is explicit.
- No business math in React: all KPIs, deltas and simulations come from `financials.ts` / `simulation.ts`.
- Input validation: question length caps, parameter clamping, malformed-input fallbacks, graceful Hindsight-offline behavior.
- Secrets: only server-side env vars (`HINDSIGHT_BASE_URL`, LLM keys configured on the Hindsight server itself — never in frontend code).

## Future scope

- Scheduled competitor ingestion from public sources (RSS, pricing-page diffing) into World memory.
- Decision-outcome reconciliation: when a "pending" decision's window closes, prompt for actuals and retain the delta.
- Mental models / knowledge pages for standing answers ("What is our pricing doctrine?").
- Multi-company selector with per-company bank namespacing.
- CSV/JSON upload pipeline with validation and anomaly review before retention.
- Scenario comparison tables with probability-weighted competitor responses.
