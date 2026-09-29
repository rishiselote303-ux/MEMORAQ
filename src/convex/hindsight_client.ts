// hindsight_client.ts — the ONLY place that talks to Hindsight.
//
// Runs against a Hindsight server (self-hosted by default, no API key):
// default http://localhost:8888, override with the HINDSIGHT_BASE_URL env var.
// For hosted/cloud instances set HINDSIGHT_API_KEY (sent as Bearer token).
// Official SDK: @vectorize-io/hindsight-client (verified against v0.10.1).
//
// Two memory banks (Hindsight banks):
//   EXPERIENCE — the organization's own decisions, outcomes, observations
//   WORLD      — competitor events and market context
//
// If the local server is unreachable, every function degrades to a clearly
// labeled "fallback" mode backed by a local store, and the memory activity
// log records which mode served each operation. Nothing is faked as live.

"use node";

import { HindsightClient } from "@vectorize-io/hindsight-client";
import { internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { MEMORY_SEED } from "./mockdata";
import { EXPERIENCE_BANK, WORLD_BANK } from "./banks";

export { EXPERIENCE_BANK, WORLD_BANK };

export interface EvidenceSource {
  text: string;
  type: string; // world | experience | observation | fallback
  date: string; // ISO date string ("" when unknown)
  kind: string; // which bank it came from
}

export interface HindsightOpResult {
  mode: "live" | "fallback";
  sources: EvidenceSource[];
  answer?: string; // reflect only
  error?: string;
}

let cachedClient: HindsightClient | null = null;

function getClient(): HindsightClient {
  if (!cachedClient) {
    const baseUrl = process.env.HINDSIGHT_BASE_URL || "http://localhost:8888";
    const apiKey = process.env.HINDSIGHT_API_KEY;
    cachedClient = new HindsightClient({
      baseUrl,
      maxAttempts: 1,
      ...(apiKey ? { apiKey } : {}),
    });
  }
  return cachedClient;
}

// Health is probed often (every memory op). Cache the answer briefly so a
// offline server costs one short timeout per action instead of one per call.
const HEALTH_TTL_MS = 20_000;
let healthCache: { at: number; alive: boolean } | null = null;

/** True when the self-hosted Hindsight server answers a version probe. */
export async function checkHindsightHealth(): Promise<boolean> {
  if (healthCache && Date.now() - healthCache.at < HEALTH_TTL_MS) {
    return healthCache.alive;
  }
  let alive = false;
  try {
    const client = getClient();
    const version = await client.getVersion({
      signal: AbortSignal.timeout(2500),
    });
    alive = Boolean(version?.api_version);
  } catch {
    alive = false;
  }
  healthCache = { at: Date.now(), alive };
  return alive;
}

async function ensureBanks(client: HindsightClient): Promise<void> {
  await client.createBank(EXPERIENCE_BANK, {
    reflectMission:
      "You are the organizational memory of Northwind Instruments. You remember the company's own strategic decisions, pricing experiments, outcomes and lessons. Ground every answer in retained decisions and outcomes, cite what actually happened, and never invent numbers.",
    retainMission:
      "Retain strategic decisions, their expected and actual outcomes, financial events, pricing experiments, management observations and lessons learned.",
  });
  await client.createBank(WORLD_BANK, {
    reflectMission:
      "You are the competitive intelligence memory of Northwind Instruments. You remember competitor actions, public pricing moves, launches and market context. Report only what was observed; frame anything about the future as a hypothesis with evidence.",
    retainMission:
      "Retain competitor events, public pricing changes, product launches, promotions, announcements and market context.",
  });
}

async function logActivity(
  ctx: ActionCtx,
  entry: {
    kind: "RETAIN" | "RECALL" | "REFLECT";
    bank: "experience" | "world";
    query?: string;
    summary: string;
    sources: EvidenceSource[];
    origin: string;
    mode: "live" | "fallback";
  },
): Promise<void> {
  await ctx.runMutation(internal.memory.logActivity, {
    kind: entry.kind,
    bank: entry.bank,
    query: entry.query,
    summary: entry.summary,
    sources: entry.sources.slice(0, 8),
    origin: entry.origin,
    mode: entry.mode,
  });
}

async function storeFallback(
  ctx: ActionCtx,
  bank: "experience" | "world",
  items: {
    sourceId: string;
    text: string;
    context: string;
    occurredAt: string;
    tags: string[];
  }[],
): Promise<void> {
  for (const item of items) {
    await ctx.runMutation(internal.memory.upsertFallback, {
      bank,
      sourceId: item.sourceId,
      text: item.text,
      context: item.context,
      occurredAt: item.occurredAt,
      tags: item.tags,
    });
  }
}

function mapRecallResults(
  results: Array<{
    text: string;
    type?: string | null;
    context?: string | null;
    occurred_start?: string | null;
    mentioned_at?: string | null;
    metadata?: Record<string, string> | null;
  }>,
  bank: "experience" | "world",
): EvidenceSource[] {
  return results.map((r) => ({
    text: r.text,
    type: r.type ?? "fact",
    date: (r.occurred_start || r.mentioned_at || "").slice(0, 10),
    kind: r.metadata?.kind || bank,
  }));
}

// ---------------------------------------------------------------- RETAIN

export interface RetainItem {
  content: string;
  timestamp: string; // ISO — when the event actually happened
  context: string;
  documentId: string;
  tags: string[];
  sourceId: string; // used only by the fallback store
  occurredAt: string;
}

/** Retain items into a Hindsight bank; falls back to the local store. */
export async function retainMemory(
  ctx: ActionCtx,
  opts: {
    bank: "experience" | "world";
    items: RetainItem[];
    origin: string;
  },
): Promise<HindsightOpResult> {
  const alive = await checkHindsightHealth();
  if (alive) {
    try {
      const client = getClient();
      await ensureBanks(client);
      const bankId = opts.bank === "experience" ? EXPERIENCE_BANK : WORLD_BANK;
      for (const item of opts.items) {
        await client.retain(bankId, item.content, {
          timestamp: item.timestamp,
          context: item.context,
          documentId: item.documentId,
          tags: item.tags,
          metadata: { kind: opts.bank, sourceId: item.sourceId },
          // Async ingestion: Hindsight's worker extracts facts in the
          // background, so seeding 20+ records does not block the request.
          async: true,
        });
      }
      const sources: EvidenceSource[] = opts.items.map((i) => ({
        text: i.content.slice(0, 220),
        type: opts.bank,
        date: i.occurredAt,
        kind: opts.bank,
      }));
      await logActivity(ctx, {
        kind: "RETAIN",
        bank: opts.bank,
        summary: `Retained ${opts.items.length} item${opts.items.length === 1 ? "" : "s"} into ${opts.bank} memory`,
        sources,
        origin: opts.origin,
        mode: "live",
      });
      return { mode: "live", sources };
    } catch (e) {
      // fall through to fallback store
      await storeFallback(
        ctx,
        opts.bank,
        opts.items.map((i) => ({
          sourceId: i.sourceId,
          text: i.content,
          context: i.context,
          occurredAt: i.occurredAt,
          tags: i.tags,
        })),
      );
      await logActivity(ctx, {
        kind: "RETAIN",
        bank: opts.bank,
        summary: `Hindsight retain failed (${e instanceof Error ? e.message : "error"}); stored in local fallback memory`,
        sources: opts.items.map((i) => ({
          text: i.content.slice(0, 220),
          type: "fallback",
          date: i.occurredAt,
          kind: opts.bank,
        })),
        origin: opts.origin,
        mode: "fallback",
      });
      return {
        mode: "fallback",
        sources: [],
        error: e instanceof Error ? e.message : "retain failed",
      };
    }
  }
  await storeFallback(
    ctx,
    opts.bank,
    opts.items.map((i) => ({
      sourceId: i.sourceId,
      text: i.content,
      context: i.context,
      occurredAt: i.occurredAt,
      tags: i.tags,
    })),
  );
  await logActivity(ctx, {
    kind: "RETAIN",
    bank: opts.bank,
    summary: `Hindsight server offline; stored ${opts.items.length} item(s) in local fallback memory`,
    sources: opts.items.map((i) => ({
      text: i.content.slice(0, 220),
      type: "fallback",
      date: i.occurredAt,
      kind: opts.bank,
    })),
    origin: opts.origin,
    mode: "fallback",
  });
  return { mode: "fallback", sources: [], error: "hindsight offline" };
}

// ---------------------------------------------------------------- RECALL

export async function recallMemory(
  ctx: ActionCtx,
  opts: {
    bank: "experience" | "world";
    query: string;
    types?: string[];
    maxTokens?: number;
    origin: string;
  },
): Promise<HindsightOpResult> {
  const alive = await checkHindsightHealth();
  if (alive) {
    try {
      const client = getClient();
      const bankId = opts.bank === "experience" ? EXPERIENCE_BANK : WORLD_BANK;
      const response = await client.recall(bankId, opts.query, {
        types: opts.types,
        budget: "low",
        maxTokens: opts.maxTokens ?? 1200,
      });
      const sources = mapRecallResults(response.results ?? [], opts.bank);
      await logActivity(ctx, {
        kind: "RECALL",
        bank: opts.bank,
        query: opts.query,
        summary: `Recalled ${sources.length} relevant memor${sources.length === 1 ? "y" : "ies"} from ${opts.bank} memory`,
        sources,
        origin: opts.origin,
        mode: "live",
      });
      return { mode: "live", sources };
    } catch (e) {
      return fallbackRecall(ctx, opts, e instanceof Error ? e.message : "recall failed");
    }
  }
  return fallbackRecall(ctx, opts, "hindsight offline");
}

async function fallbackRecall(
  ctx: ActionCtx,
  opts: { bank: "experience" | "world"; query: string; origin: string },
  error: string,
): Promise<HindsightOpResult> {
  const rows = (await ctx.runQuery(internal.memory.searchFallback, {
    bank: opts.bank,
    query: opts.query,
  })) as Array<{ text: string; occurredAt: string; context: string }>;
  const sources: EvidenceSource[] = rows.map((r) => ({
    text: r.text,
    type: "fallback",
    date: r.occurredAt,
    kind: opts.bank,
  }));
  await logActivity(ctx, {
    kind: "RECALL",
    bank: opts.bank,
    query: opts.query,
    summary: `Hindsight unavailable (${error}); recalled ${sources.length} match(es) from local fallback memory`,
    sources,
    origin: opts.origin,
    mode: "fallback",
  });
  return { mode: "fallback", sources, error };
}

// --------------------------------------------------------------- REFLECT

export async function reflectMemory(
  ctx: ActionCtx,
  opts: {
    bank: "experience" | "world";
    query: string;
    origin: string;
  },
): Promise<HindsightOpResult> {
  const alive = await checkHindsightHealth();
  if (alive) {
    try {
      const client = getClient();
      const bankId = opts.bank === "experience" ? EXPERIENCE_BANK : WORLD_BANK;
      const response = await client.reflect(bankId, opts.query, {
        budget: "low",
        includeFacts: true,
      });
      const memories = response.based_on?.memories ?? [];
      const sources: EvidenceSource[] = memories.map((m) => ({
        text: m.text,
        type: m.type ?? "memory",
        date: (m.occurred_start || "").slice(0, 10),
        kind: opts.bank,
      }));
      await logActivity(ctx, {
        kind: "REFLECT",
        bank: opts.bank,
        query: opts.query,
        summary: `Reflected over ${opts.bank} memory (${sources.length} grounded source(s))`,
        sources,
        origin: opts.origin,
        mode: "live",
      });
      return { mode: "live", sources, answer: response.text };
    } catch (e) {
      return fallbackReflect(ctx, opts, e instanceof Error ? e.message : "reflect failed");
    }
  }
  return fallbackReflect(ctx, opts, "hindsight offline");
}

async function fallbackReflect(
  ctx: ActionCtx,
  opts: { bank: "experience" | "world"; query: string; origin: string },
  error: string,
): Promise<HindsightOpResult> {
  const rows = (await ctx.runQuery(internal.memory.searchFallback, {
    bank: opts.bank,
    query: opts.query,
  })) as Array<{ text: string; occurredAt: string; context: string }>;
  const sources: EvidenceSource[] = rows.map((r) => ({
    text: r.text,
    type: "fallback",
    date: r.occurredAt,
    kind: opts.bank,
  }));
  const answer =
    sources.length > 0
      ? `**[Fallback mode — Hindsight server offline (${error})]**\n\nSynthesized from ${sources.length} relevant memor${sources.length === 1 ? "y" : "ies"} in ${opts.bank} memory:\n\n` +
        sources.slice(0, 5).map((s) => `- ${s.date ? `(${s.date}) ` : ""}${s.text}`).join("\n")
      : `**[Fallback mode]** No relevant memories found in ${opts.bank} memory for this question.`;
  await logActivity(ctx, {
    kind: "REFLECT",
    bank: opts.bank,
    query: opts.query,
    summary: `Hindsight unavailable (${error}); reflected over local fallback memory (${sources.length} source(s))`,
    sources,
    origin: opts.origin,
    mode: "fallback",
  });
  return { mode: "fallback", sources, answer, error };
}

// ------------------------------------------------------------------ SEED

/**
 * Seed both banks with the demo dataset — experience memory (decisions,
 * outcomes, observations, conversation) and world memory (competitor events,
 * market context). Uses live Hindsight when reachable, otherwise fills the
 * labeled local fallback store.
 */
export async function seedMemoryBanks(
  ctx: ActionCtx,
  origin = "system ingest",
): Promise<{ experience: HindsightOpResult; world: HindsightOpResult }> {
  const experienceItems = MEMORY_SEED.filter((s) => s.bank === "experience");
  const worldItems = MEMORY_SEED.filter((s) => s.bank === "world");

  const toRetainItems = (bank: "experience" | "world") =>
    MEMORY_SEED.filter((s) => s.bank === bank).map((s) => ({
      content: s.text,
      timestamp: s.occurredAt,
      context: s.context,
      documentId: `seed-${s.sourceId}`,
      tags: s.tags,
      sourceId: s.sourceId,
      occurredAt: s.occurredAt,
    }));

  const experience = await retainMemory(ctx, {
    bank: "experience",
    items: toRetainItems("experience"),
    origin,
  });
  const world = await retainMemory(ctx, {
    bank: "world",
    items: toRetainItems("world"),
    origin,
  });
  return { experience, world };
}
