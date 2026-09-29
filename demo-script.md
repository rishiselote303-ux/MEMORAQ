# MEMORAQ — 3-Minute Screen-Recorded Demo Script

**Runtime:** ~3:20 · **Tone:** conversational, like pairing with a coworker · **Format:** talking over screen recording
**Prep before recording:** app running with Hindsight container OFF for part 2, then start it live. `[YOUR NAME]` = your name.

---

## 1. Quick intro — 0:00–0:30

**[SCREEN: Landing page at `/`. Slow scroll so the headline "Remember the past. Understand the present. Simulate the future." is readable, then stop.]**

> Hey, I'm [YOUR NAME]. So this is a project I've been building called MEMORAQ — it's a strategy co-pilot, but the pitch is basically: what if your AI actually *remembered* every decision your company ever made?
>
> Everything you'll see is a fake demo company — Northwind Instruments — with six months of financials, past decisions, and competitor moves. Two things under the hood matter: a deterministic finance engine — the LLM is never allowed to do the math — and an open-source memory server called Hindsight. Let me show you why that combo is interesting.

---

## 2. The problem — 0:30–1:00

**[SCREEN: Your terminal. Show `bun install`, `bun convex dev --once`, then `bun run dev`. Cut to browser → sign in as guest → land on `/dashboard`. Immediately point your cursor at the TOP-RIGHT status dot — it's RED, reading "Hindsight offline — fallback mode".]**

> Quick caveat for the demo: right now I've deliberately *not* started the memory server. Watch the top right — red dot. The app probes it on load — that's `api.actions.health`, it just hits `/version` on `localhost:8888` — and it knows the memory is down.
>
> So let's ask the Executive AI something a strategist would actually ask: *why did margins drop in June?*

**[SCREEN: Type the question into the Executive AI panel, bottom-right. Let the answer render — highlight the bold "[Fallback mode]" prefix at the top.]**

> It still answers — nothing crashes — but look at the label. "Fallback mode… synthesized from the labeled local fallback memory." And over in the Memory Inspector — this ledger of every memory operation — each row is tagged FALLBACK.
>
> This is what most AI tools actually are: a stateless assistant. Smart-ish, but it starts from zero every single session. It doesn't know what your company already tried and what that cost.

---

## 3. Live demo — 1:00–3:00

### 3a. Turn the memory on (1:00–1:30)

**[SCREEN: Terminal. Paste the Hindsight docker command from the README — `docker run -it --pull always --name hindsight -p 8888:8888 -p 9999:9999 -e HINDSIGHT_API_LLM_API_KEY=$OPENAI_API_KEY -v hindsight-data:/home/hindsight/.pg0 ghcr.io/vectorize-io/hindsight:latest`. Then cut to the browser: the dot flips GREEN "Hindsight connected" on its own. Click "Re-ingest" in the header.]**

> Okay, the fix is one docker command. Container's up — and watch the status dot… green. "Hindsight connected." I'll hit Re-ingest to seed both memory banks — there's an experience bank and a world bank — and now watch the Memory Inspector light up.

**[SCREEN: Memory Inspector, left side of row 4. Rows animate in with colored badges — black RETAIN, blue RECALL, red REFLECT. Click one row open to show the sources with dates.]**

> Each of these rows is a real API call, not a mock-up. I can expand one and see the actual facts that got retained, with dates. All of that goes through one file, by the way — `src/convex/hindsight_client.ts` is the only place in the codebase that talks to the server.

### 3b. The before/after moment (1:30–2:20)

**[SCREEN: Same June question in the Executive AI again — no fallback label this time. Then scroll to the cited evidence under the answer.]**

> Same question as before: why did margins drop in June? No fallback label now. And the answer is citing *memory*: small price cuts converted to volume, one deep 10% cut anchored the price permanently lower, and the one time Northwind raised prices during an active competitor promotion — that's the June drawdown. The sources are on screen.

**[SCREEN: Strategy Canvas. Drag the price slider to −7%. Pause a beat on the projected revenue/margin deltas, then highlight the panel underneath: "Historical evidence — recalled from Hindsight".]**

> Here's my favorite moment. I drag the price lever to minus seven percent. The revenue and margin projections update instantly — that's the deterministic engine, plain TypeScript, `src/convex/hypotheses.ts` and friends. The LLM isn't computing anything. And underneath, a panel slides in: "Historical evidence — recalled from Hindsight" — the two most similar experiments from the company's past, right next to the numbers. The AI isn't pattern-matching vibes. It's matching against *receipts*.

### 3c. Close the loop — retain (2:20–3:00)

**[SCREEN: Decision Memory panel. Record the decision, then click "Retain". Capture the toast: "Decision D-… retained into Hindsight". Then point at the new black RETAIN row in the Memory Inspector.]**

> And here's the loop most tools skip. I've made my call, so in Decision Memory I record the decision and hit Retain. Toast: "Decision retained into Hindsight." New RETAIN row in the inspector.

**[SCREEN: Back to Executive AI. Ask a follow-up that touches the decision you just retained. Highlight the newly retained item appearing in the RECALL sources.]**

> Now ask a follow-up about that exact decision… and there it is — today's decision comes back in the recall sources. Nobody re-explained anything. The system literally learned while we were watching. That's the before/after: thirty seconds ago this app had amnesia.

---

## 4. One key takeaway — 3:00–3:30

**[SCREEN: Split view if you can — Memory Inspector on the left, Executive AI answer on the right. Or just the footer: "AI recommends; humans decide."]**

> The thing that genuinely surprised me: the failure mode ended up being the best feature. When I kill the memory server mid-session, nothing breaks and — more importantly — nothing *lies*. Every affected row and every answer gets a labeled FALLBACK tag. Building the honesty layer first is what made the live mode trustworthy to me.
>
> And the constraint I'd keep forever: the LLM only ever speaks through Hindsight's `reflect` — it explains, it never computes. That's what makes these answers something you could actually take to a board meeting.

**[END CARD: repo URL + "MEMORAQ — institutional memory for serious decisions."]**

---

## Setup cheat-sheet (for your recording notes)

```bash
# Memory server (part 3)
docker run -it --pull always --name hindsight --restart unless-stopped \
  -p 8888:8888 -p 9999:9999 \
  -e HINDSIGHT_API_LLM_API_KEY=$OPENAI_API_KEY \
  -v hindsight-data:/home/hindsight/.pg0 \
  ghcr.io/vectorize-io/hindsight:latest

# App
bun install
bun convex dev --once
bun run dev
```

- Sign in: email OTP or guest → `/dashboard` (first load auto-ingests the demo org)
- Status dot = `api.actions.health` → probes `/version` on the Hindsight server
- All memory traffic: `src/convex/hindsight_client.ts` (retain / recall / reflect)
- Agent orchestration: `src/convex/agent.ts` (`askCopilot`)
- Demo panels: Memory Inspector, Executive AI, Strategy Canvas, Decision Memory (all in `src/components/copilot/`)
- Pro move: record the June question answer in BOTH modes (offline first, online second) and cut them back-to-back — that's your thumbnail moment

---

## 5 High-performing YouTube titles

1. **I Gave My AI Agent a Perfect Memory (Here's What Happened)**
2. **Your AI Forgets Everything — I Built Mine a Brain**
3. **Why I Stopped Letting LLMs Do Math — and Built This Instead**
4. **This AI Remembers Every Decision Your Company Ever Made**
5. **The Co-Pilot That Learns From Every Mistake (Live Demo)**
