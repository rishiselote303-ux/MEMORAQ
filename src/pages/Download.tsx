import { Button } from "@/components/ui/button";
import { SwissThemeMark } from "@/components/copilot/SwissThemeMark";
import {
  ARCHIVE_SHA256,
  ARCHIVE_FILENAME,
  buildArchiveObjectUrl,
  downloadProjectArchive,
} from "@/lib/download-archive";
import { ArrowDownToLine, CheckCircle2, ExternalLink, FileArchive } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const INCLUDE = [
  "React frontend — landing, auth, executive dashboard, all panels",
  "Convex backend — agent, financial & simulation engines, API layer",
  "Hindsight integration — retain / recall / reflect with fallback mode",
  "Six-month demo dataset, competitor events and decision records",
  "README with architecture, local Hindsight setup and demo flow",
];

const EXCLUDE = [
  "node_modules (restore with bun install)",
  "Generated Convex types (recreate with bun convex dev --once)",
  "Environment files with live secrets — manage via the API Keys tab",
];

export default function Download() {
  const [saving, setSaving] = useState(false);
  // Object URL is built once on demand and reused for the fallback link.
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  const handleDownload = () => {
    setSaving(true);
    try {
      downloadProjectArchive();
      if (!fallbackUrl) setFallbackUrl(buildArchiveObjectUrl());
      toast.success("Archive sent to your downloads", {
        description:
          "If nothing appeared, your browser may have blocked it — use the fallback below.",
      });
    } catch {
      toast.error("Could not assemble the archive in this browser");
    } finally {
      setTimeout(() => setSaving(false), 600);
    }
  };

  return (
    <main className="swiss-grid-bg flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="swiss-panel swiss-ink-top w-full max-w-lg">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <SwissThemeMark className="size-9 shrink-0" />
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">MEMORAQ</p>
            <p className="swiss-kicker">Strategy Co-Pilot</p>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center gap-2">
            <FileArchive className="size-4 text-[#1f4e9c]" />
            <p className="swiss-kicker">Project archive — complete source</p>
          </div>
          <h1 className="swiss-headline mt-3 text-3xl">{ARCHIVE_FILENAME}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The full codebase in a single archive, assembled locally in your
            browser from the embedded payload — no server round-trip.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="swiss-kicker mb-2">Included</p>
              <ul className="space-y-1.5">
                {INCLUDE.map((item) => (
                  <li key={item} className="text-xs leading-relaxed text-foreground">
                    ✓ {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="swiss-kicker mb-2">Not included</p>
              <ul className="space-y-1.5">
                {EXCLUDE.map((item) => (
                  <li key={item} className="text-xs leading-relaxed text-muted-foreground">
                    — {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button
            size="lg"
            className="mt-6 w-full cursor-pointer gap-2 bg-[#1f4e9c] text-white hover:bg-[#1f4e9c]/85"
            onClick={handleDownload}
            disabled={saving}
          >
            <ArrowDownToLine className="size-4" />
            {saving ? "Assembling archive…" : "Download the zip"}
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-[#2f9e63]" />
            Integrity: sha256 {ARCHIVE_SHA256.slice(0, 16)}…
          </p>

          {fallbackUrl && (
            <div className="mt-4 border border-[#d5281b]/30 bg-[#d5281b]/[0.04] p-3">
              <p className="text-xs font-semibold text-foreground">
                Nothing arrived in your downloads folder?
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                Your browser or the preview sandbox may have blocked the
                automatic save. Use this instead — it opens the generated file
                directly:
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full cursor-pointer gap-2"
                onClick={() => {
                  const url = fallbackUrl ?? buildArchiveObjectUrl();
                  window.open(url, "_blank", "noopener");
                }}
              >
                <ExternalLink className="size-3.5" />
                Open archive in a new tab
              </Button>
            </div>
          )}

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Also available at the project root and at{" "}
            <a className="underline hover:text-foreground" href="/hindsight-strategy-copilot.zip">
              /hindsight-strategy-copilot.zip
            </a>
          </p>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            After unzipping: bun install → bun convex dev --once → bun run dev
          </p>
        </div>
      </div>
    </main>
  );
}
