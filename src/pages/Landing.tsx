import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BrainCircuit,
  ChartLine,
  CircleDot,
  Compass,
  GitBranch,
  Globe2,
  Timer,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, Navigate } from "react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ARCHIVE_FILENAME,
  ARCHIVE_SHA256,
  buildArchiveObjectUrl,
  downloadProjectArchive,
} from "@/lib/download-archive";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

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

const loop = [
  { label: "Remember", icon: BrainCircuit, note: "Experience and world memory, retained in Hindsight" },
  { label: "Understand", icon: ChartLine, note: "Six months of financials, computed deterministically" },
  { label: "Simulate", icon: GitBranch, note: "Scenario levers with stated assumptions" },
  { label: "Explain", icon: Compass, note: "Every claim carries its evidence" },
  { label: "Decide", icon: CircleDot, note: "The judgment stays with the executive" },
  { label: "Learn", icon: Timer, note: "Outcomes return to memory as lessons" },
];

const modules = [
  { icon: ChartLine, t: "Financial Intelligence", d: "Six months of revenue, margin, CAC and churn — computed by a deterministic engine, annotated where the story turns." },
  { icon: Globe2, t: "Competitor Monitor", d: "Public competitor moves distilled into strategic signals, with hypotheses that name their evidence and confidence." },
  { icon: GitBranch, t: "Strategy Canvas", d: "A deterministic what-if engine. Every simulation arrives with the comparable history from memory." },
  { icon: Activity, t: "Memory Inspector", d: "A live ledger of what the system retained, recalled and reflected — the memory is observable, not claimed." },
];

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [archiveUrl, setArchiveUrl] = useState<string | null>(null);

  const handleArchiveDownload = () => {
    setSaving(true);
    try {
      downloadProjectArchive();
      if (!archiveUrl) setArchiveUrl(buildArchiveObjectUrl());
      toast.success("Archive sent to your downloads", {
        description: "If nothing appeared, use the open-in-tab fallback under the button.",
      });
    } catch {
      toast.error("Could not assemble the archive in this browser");
    } finally {
      setTimeout(() => setSaving(false), 600);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="swiss-rule animate-pulse" />
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="swiss-grid-bg min-h-screen bg-background"
    >
      {/* Masthead */}
      <header className="swiss-ink-top sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <SwissMark />
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">MEMORAQ</p>
              <p className="swiss-kicker">Strategy Co-Pilot</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a className="hover:text-foreground" href="#problem">The problem</a>
            <a className="hover:text-foreground" href="#system">The system</a>
            <a className="hover:text-foreground" href="#loop">The method</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="cursor-pointer">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild className="cursor-pointer gap-2 bg-[#16181d] text-white hover:bg-[#16181d]/85">
              <Link to="/auth">
                Enter the workspace
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Opening statement */}
      <section className="swiss-ink-top border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:py-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Badge variant="outline" className="mb-6 border-[#d5281b] text-[#d5281b]">
              Self-hosted memory · No cloud dependency
            </Badge>
            <h1 className="swiss-headline text-5xl md:text-7xl">
              Remember the past.
              <br />
              Understand the present.
              <br />
              <span className="text-[#1f4e9c]">Simulate the future.</span>
            </h1>
            <div className="swiss-rule mt-8" />
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              MEMORAQ is a strategic intelligence system for organizations
              that refuse to re-learn the same lesson twice. It keeps the
              institutional memory of every decision, prices the present with
              deterministic precision, and rehearses the future — while leaving
              the judgment where it belongs.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="cursor-pointer gap-2 bg-[#16181d] text-white hover:bg-[#16181d]/85">
                <Link to="/auth">
                  Request access
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                The system advises. <span className="font-semibold text-foreground">The executive decides.</span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-5">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="swiss-panel swiss-ink-top-blue"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <p className="swiss-kicker">Memory ledger — live</p>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="swiss-dot bg-[#d5281b] swiss-pulse" />
                  recording
                </span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { op: "Recall", bank: "Experience", q: "prior pricing experiments, with outcomes", n: 3 },
                  { op: "Retain", bank: "World", q: "competitor entry-tier reduction, August", n: 1 },
                  { op: "Reflect", bank: "Experience", q: "patterns across six months of pricing decisions", n: 4 },
                ].map((row) => (
                  <div key={row.op + row.q} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[#1f4e9c]">{row.op}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{row.bank} bank</p>
                    </div>
                    <p className="mt-1 text-sm text-foreground">{row.q}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.n} grounded source{row.n === 1 ? "" : "s"} returned
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border bg-secondary px-4 py-2.5">
                <p className="text-[11px] text-muted-foreground">
                  An excerpt from the operational ledger. Every panel in the
                  workspace is driven by entries like these.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem / system / discipline */}
      <section id="problem" className="border-b border-border bg-secondary/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3 md:py-20">
          {[
            {
              kicker: "01 — The problem",
              title: "Institutions forget",
              body: "Decisions are made, results land in a spreadsheet, and the reasoning evaporates. A year later the same debate restarts from zero — with no record of what was tried, what it cost, or what it taught.",
            },
            {
              kicker: "02 — The system",
              title: "Memory, not another chatbot",
              body: "Hindsight retains every decision, outcome and competitor move in dedicated memory banks, then recalls and reflects over them on demand. The intelligence compounds; nothing has to be re-explained.",
            },
            {
              kicker: "03 — The discipline",
              title: "Facts, simulations, hypotheses",
              body: "Financials and projections come from deterministic code, never from a language model. Uncertainty is labeled for what it is — hypothesis, assumption, confidence — and evidence travels with every claim.",
            },
          ].map((c, i) => (
            <motion.div
              key={c.kicker}
              {...fadeUp}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.08 }}
            >
              <p className="swiss-kicker">{c.kicker}</p>
              <h3 className="swiss-headline mt-3 text-2xl">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Method */}
      <section id="loop" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p className="swiss-kicker">The method</p>
          <h2 className="swiss-headline mt-3 max-w-2xl text-4xl md:text-5xl">
            One continuous cycle of institutional learning.
          </h2>
          <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {loop.map((step, i) => (
              <motion.div
                key={step.label}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.05 + i * 0.06 }}
                className="group bg-card p-6 transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <step.icon className="size-5 text-[#1f4e9c]" />
                  <span className="swiss-num text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-4 text-lg font-bold tracking-tight">{step.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.note}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* System */}
      <section id="system" className="border-b border-border bg-secondary/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
          <div>
            <p className="swiss-kicker">Inside the system</p>
            <h2 className="swiss-headline mt-3 text-4xl md:text-5xl">
              Four disciplines. One memory.
            </h2>
            <div className="swiss-rule mt-6" />
            <ul className="mt-8 space-y-5">
              {modules.map((f) => (
                <li key={f.t} className="flex gap-4">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center border border-border bg-card">
                    <f.icon className="size-4 text-[#1f4e9c]" />
                  </div>
                  <div>
                    <p className="font-semibold tracking-tight">{f.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="swiss-panel swiss-ink-top self-start p-6 font-mono text-xs leading-6 text-muted-foreground">
            <p className="swiss-kicker mb-4 font-sans">System architecture</p>
            <pre className="overflow-x-auto whitespace-pre">{`React + Vite + Recharts
        │
        ▼  queries · actions
┌───────────────────────┐
│  Orchestration layer  │
│  agent · financials   │
│  simulation · api     │
└──────────┬────────────┘
           │
┌──────────▼────────────┐
│  hindsight_client.ts  │
│  retain / recall /    │
│  reflect              │
└──────────┬────────────┘
           │
┌──────────▼────────────┐
│ HINDSIGHT (self-host) │
│ northwind-experience  │
│ northwind-world       │
└───────────────────────┘`}</pre>
          </div>
        </div>
      </section>

      {/* Full source archive — downloadable from the homepage */}
      <section id="source-archive" className="swiss-ink-top-blue border-b border-border bg-secondary/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="swiss-kicker">Complete source code</p>
            <h2 className="swiss-headline mt-3 text-4xl md:text-5xl">
              Take the whole system with you.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              The full project — frontend, backend, memory integration, demo
              dataset and documentation — packaged as a single archive and
              assembled locally in your browser when you click. Nothing is
              uploaded or fetched from a server.
              {" "}
              <a className="underline hover:text-foreground" href="#source-archive">
                #source-archive
              </a>
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                className="cursor-pointer gap-2 bg-[#1f4e9c] text-white hover:bg-[#1f4e9c]/85"
                onClick={handleArchiveDownload}
                disabled={saving}
              >
                <ArrowDownToLine className="size-4" />
                {saving ? "Assembling archive…" : `Download ${ARCHIVE_FILENAME}`}
              </Button>
              <p className="text-[11px] text-muted-foreground">
                sha256 {ARCHIVE_SHA256.slice(0, 16)}… · verified intact
              </p>
            </div>
            {archiveUrl && (
              <div className="mt-4 border border-[#d5281b]/30 bg-[#d5281b]/[0.04] p-3">
                <p className="text-xs font-semibold text-foreground">
                  Nothing arrived in your downloads folder?
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  The preview sandbox can block automatic saves. Open the
                  generated file directly:
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 cursor-pointer gap-2"
                  onClick={() => window.open(archiveUrl, "_blank", "noopener")}
                >
                  Open archive in a new tab
                </Button>
            </div>
            )}
          </div>
          <div className="swiss-panel md:col-span-5">
            <div className="border-b border-border px-4 py-2.5">
              <p className="swiss-kicker">In the archive</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border">
              {[
                ["Files", "128"],
                ["Runtime", "Bun + Vite"],
                ["Backend", "Convex functions"],
                ["Memory", "Self-hosted Hindsight"],
              ].map(([k, v]) => (
                <div key={k} className="bg-card px-4 py-3">
                  <p className="swiss-kicker">{k}</p>
                  <p className="swiss-num mt-1 text-lg font-bold tracking-tight">{v}</p>
                </div>
              ))}
            </div>
            <div className="px-4 py-3">
              <ul className="space-y-1.5">
                {[
                  "React frontend — landing, auth, executive dashboard, all panels",
                  "Convex backend — agent, financial & simulation engines, API layer",
                  "Hindsight integration — retain / recall / reflect with fallback",
                  "Six-month demo dataset, competitor events, decision records",
                  "README — architecture, local Hindsight setup, demo flow",
                ].map((item) => (
                  <li key={item} className="text-xs leading-relaxed text-foreground">
                    ✓ {item}
                  </li>
                ))}
                <li className="text-xs leading-relaxed text-muted-foreground">
                  — Excludes node_modules (bun install) and environment secrets
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Closing statement */}
      <section className="swiss-ink-top border-b border-[#16181d] bg-[#16181d] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="swiss-headline text-4xl md:text-5xl">Let humans decide.</h2>
            <p className="mt-3 max-w-xl text-white/70">
              The machine remembers, computes and explains. The final call —
              with full sight of the evidence — remains a human act.
            </p>
          </div>
          <Button asChild size="lg" className="cursor-pointer gap-2 bg-white text-[#16181d] hover:bg-white/85">
            <Link to="/auth">
              Sign in
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <SwissMark className="size-6" />
          <span>MEMORAQ — institutional memory for serious decisions</span>
        </div>
        <span>
          Hindsight runs self-hosted. Simulations are estimates, never promises.
        </span>
      </footer>
    </motion.div>
  );
}
