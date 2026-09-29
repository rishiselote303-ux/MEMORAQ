// Dashboard.tsx — the executive workspace. Top bar with memory/system status,
// KPI strip, then the module grid: Financial Journey + Strategic Radar,
// Strategy Canvas, Competitor Monitor + Decision Memory, Memory Inspector +
// Executive AI. Auto-ingests demo data on first load.

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Database,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { KpiRow } from "@/components/copilot/KpiRow";
import { FinancialJourney } from "@/components/copilot/FinancialJourney";
import { StrategicRadar } from "@/components/copilot/StrategicRadar";
import { StrategyCanvas } from "@/components/copilot/StrategyCanvas";
import { CompetitorMonitor } from "@/components/copilot/CompetitorMonitor";
import { DecisionMemory } from "@/components/copilot/DecisionMemory";
import { MemoryInspector } from "@/components/copilot/MemoryInspector";
import { ExecutiveAI } from "@/components/copilot/ExecutiveAI";

function SwissMark({ className = "size-9" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center border border-foreground bg-card ${className}`}
      aria-hidden
    >
      <div className="h-3.5 w-3.5 bg-[#d5281b]" />
    </div>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const healthAction = useAction(api.actions.health);
  const ingestAction = useAction(api.actions.ingest);
  const seedState = useQuery(api.memory.getState, { key: "seeded" });
  const setSeedState = useMutation(api.memory.setStateAction);
  const [health, setHealth] = useState<{
    hindsight: "connected" | "offline";
    baseUrl: string;
  } | null>(null);

  const ingestStartedRef = useRef(false);
  const [ingesting, setIngesting] = useState(false);

  const runIngest = async () => {
    setIngesting(true);
    try {
      await ingestAction({});
      await setSeedState({ key: "seeded", value: "true" });
    } catch {
      toast.error("Ingest failed", { description: "Memory seeding did not complete." });
    } finally {
      setIngesting(false);
    }
  };

  useEffect(() => {
    void healthAction({}).then((h) => setHealth(h as { hindsight: "connected" | "offline"; baseUrl: string })).catch(() => setHealth(null));
  }, [healthAction]);

  useEffect(() => {
    if (seedState === null && !ingestStartedRef.current) {
      ingestStartedRef.current = true;
      void runIngest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedState]);

  const hindsightOnline = health?.hindsight === "connected";

  return (
    <div className="swiss-grid-bg min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <SwissMark />
              <div className="leading-tight">
                <p className="text-sm font-bold tracking-tight">MEMORAQ</p>
                <p className="swiss-kicker">Northwind Instruments · Mar – Aug 2026</p>
              </div>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* System status */}
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className="swiss-dot swiss-pulse"
                style={{ background: hindsightOnline ? "#2f9e63" : "#d5281b" }}
              />
              <span className="text-muted-foreground">
                Hindsight {health === null ? "checking…" : hindsightOnline ? "connected" : "offline — fallback mode"}
              </span>
            </div>
            {/* Memory status */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Database className="size-3.5" />
              {seedState === "true" ? "Memory seeded" : "Seeding…"}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5 text-xs"
              onClick={() => void runIngest()}
              disabled={ingesting}
            >
              {ingesting ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              Re-ingest
            </Button>
            <div className="h-5 w-px bg-border" />
            <Button variant="ghost" size="sm" className="cursor-pointer gap-1.5 text-xs" onClick={() => void signOut()}>
              <LogOut className="size-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] space-y-4 px-6 py-6">
        <KpiRow />

        {/* Row 1: Financial Journey + Strategic Radar */}
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="min-h-[460px] lg:col-span-2">
            <FinancialJourney />
          </div>
          <div className="min-h-[460px]">
            <StrategicRadar />
          </div>
        </div>

        {/* Row 2: Strategy Canvas */}
        <div className="min-h-[440px]">
          <StrategyCanvas />
        </div>

        {/* Row 3: Competitor Monitor + Decision Memory */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="min-h-[480px]">
            <CompetitorMonitor />
          </div>
          <div className="min-h-[480px]">
            <DecisionMemory />
          </div>
        </div>

        {/* Row 4: Memory Inspector + Executive AI */}
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="min-h-[560px] lg:col-span-2">
            <MemoryInspector />
          </div>
          <div className="min-h-[560px] lg:col-span-3">
            <ExecutiveAI />
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
          <span>
            Hindsight (self-hosted, open source) · Experience + World memory banks · deterministic finance & simulation engines
          </span>
          <span>Simulations are estimates under stated assumptions — not predictions. AI recommends; humans decide.</span>
        </footer>
      </main>
    </div>
  );
}
