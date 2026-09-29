// export-article-pdf.mjs — renders article.md into article.pdf.
// Editorial print layout: serif body, Helvetica headings, red Swiss rules,
// shaded monospace code blocks, page footers. One-off build script.
// Usage: bun scripts/export-article-pdf.mjs

import { createWriteStream } from "node:fs";
import { readFile } from "node:fs/promises";
import PDFDocument from "pdfkit";

const MARGIN = 64;
const W = 595.28 - MARGIN * 2; // A4 content width
const INK = "#16181D";
const RED = "#D5281B";
const BLUE = "#1F4E9C";
const GRAY = "#8A8F98";

// ── WinAnsi sanitization (built-in PDF fonts lack → − ≈ etc.) ────────────────
const sanitize = (s) =>
  s
    .replace(/\u2192/g, "->")
    .replace(/\u2212/g, "-")
    .replace(/\u2264/g, "<=")
    .replace(/\u2265/g, ">=")
    .replace(/\u2248/g, "~")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/[^\x00-\x7F]/g, "-");

// ── Inline markdown tokenizer → runs ─────────────────────────────────────────
function tokenizeInline(text) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    const t = m[0];
    if (t.startsWith("**")) out.push({ text: t.slice(2, -2), bold: true });
    else if (t.startsWith("`")) out.push({ text: t.slice(1, -1), code: true });
    else if (t.startsWith("*")) out.push({ text: t.slice(1, -1), italic: true });
    else {
      const lm = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (lm) out.push({ text: lm[1], href: lm[2] });
      else out.push({ text: t });
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

function runFont(r) {
  if (r.code) return r.bold ? "Courier-Bold" : "Courier";
  if (r.bold && r.italic) return "Times-BoldItalic";
  if (r.bold) return "Times-Bold";
  if (r.italic) return "Times-Italic";
  return "Times-Roman";
}

// ── Document ─────────────────────────────────────────────────────────────────
const md = await readFile("article.md", "utf8");
const lines = md.split("\n");
const titleLine = lines.find((l) => l.startsWith("# ")) || "# Untitled";
const TITLE = titleLine.slice(2).trim();

const doc = new PDFDocument({
  size: "A4",
  margins: { top: 72, bottom: 64, left: MARGIN, right: MARGIN },
  info: {
    Title: TITLE,
    Author: "MEMORAQ engineering",
    Subject: "Engineering article — MEMORAQ strategy co-pilot",
    Keywords: "MEMORAQ, Hindsight, agent memory, deterministic simulation, Convex",
    Creator: "MEMORAQ",
  },
});

const out = createWriteStream("article.pdf");
doc.pipe(out);

function paragraph(text, { bullet = false } = {}) {
  const runs = tokenizeInline(text);
  runs.forEach((r, i) => {
    const f = runFont(r);
    doc.font(f).fontSize(r.code ? 9.5 : 10.5);
    doc.fillColor(r.href ? BLUE : r.code ? INK : INK);
    const opts = {
      width: W - (bullet ? 14 : 0),
      align: bullet ? "left" : "justify",
      lineGap: 3.4,
      continued: i < runs.length - 1,
    };
    if (bullet) opts.indent = 0;
    if (r.href) { opts.link = r.href; opts.underline = true; }
    if (i === 0 && bullet) doc.text("\u2022  " + sanitize(r.text), { ...opts, continued: true });
    else doc.text(sanitize(r.text), opts);
  });
  doc.text("", { continued: false }); // flush paragraph
}

let inCode = false;
let codeBuf = [];
let firstBlock = true;

for (const raw of lines) {
  const line = raw.replace(/\s+$/, "");

  if (line.startsWith("```")) {
    if (inCode) {
      // Code block: gray panel + red left bar, Courier text. Measured first;
      // if it cannot fit in the remaining space, start a fresh page so the
      // fixed-position panel can never be clipped at the page bottom.
      const codeText = codeBuf.join("\n");
      doc.font("Courier").fontSize(8);
      const w = W - 18;
      const h = doc.heightOfString(codeText, { width: w, lineGap: 1 });
      if (doc.y + 10 + h + 14 > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
      const y0 = doc.y + 10;
      doc.rect(MARGIN, y0, W, h + 14).fill("#F2F2EF");
      doc.rect(MARGIN, y0, 3, h + 14).fill(RED);
      doc.fillColor(INK).text(codeText, MARGIN + 12, y0 + 7, { width: w, lineGap: 1 });
      doc.x = MARGIN;
      doc.y = y0 + h + 14 + 8;
      codeBuf = [];
      inCode = false;
    } else {
      inCode = true;
    }
    continue;
  }
  if (inCode) { codeBuf.push(raw); continue; }

  if (!line.trim()) continue;

  if (line.startsWith("# ") && firstBlock) {
    firstBlock = false;
    doc.font("Helvetica-Bold").fontSize(19).fillColor(INK);
    doc.text(TITLE, MARGIN, 96, { width: W, lineGap: 4 });
    const y = doc.y + 12;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + 64, y).lineWidth(3.5).strokeColor(RED).stroke();
    doc.x = MARGIN;
    doc.y = y + 22;
    continue;
  }
  if (line.startsWith("## ")) {
    doc.moveDown(0.9);
    const y = doc.y + 2;
    doc.rect(MARGIN, y, 26, 3).fill(RED);
    doc.font("Helvetica-Bold").fontSize(12.5).fillColor(INK);
    doc.text(sanitize(line.slice(3).trim()), MARGIN, y + 14, { width: W });
    doc.moveDown(0.35);
    continue;
  }
  if (line.startsWith("- ")) {
    paragraph(line.slice(2).trim(), { bullet: true });
    doc.moveDown(0.25);
    continue;
  }
  // Regular paragraph (single source line)
  paragraph(line);
  doc.moveDown(0.55);
}

// Footers are stamped afterwards with pdf-lib (see below) — PDFKit's
// bufferPages + switchToPage produced an inconsistent page tree.
doc.end();
await new Promise((resolve) => out.on("finish", resolve)); // stream fully flushed

// ── Post-process: stamp footers on every page with pdf-lib ───────────────────
const { PDFDocument: PdfLib, StandardFonts, rgb } = await import("pdf-lib");
const { readFile: readF } = await import("node:fs/promises");

const bytes = await readF("article.pdf");
const pdf = await PdfLib.load(bytes);
const pages = pdf.getPages();
const helv = await pdf.embedFont(StandardFonts.Helvetica);
const gray = rgb(0.54, 0.56, 0.6);

pages.forEach((page, idx) => {
  const { width } = page.getSize();
  const y = 22;
  const label = sanitize(`MEMORAQ - engineering notes`);
  const num = `${idx + 1} / ${pages.length}`;
  page.drawText(label, { x: MARGIN, y, size: 7.5, font: helv, color: gray });
  const numW = helv.widthOfTextAtSize(num, 7.5);
  page.drawText(num, { x: width - MARGIN - numW, y, size: 7.5, font: helv, color: gray });
});

const { writeFile: writeF } = await import("node:fs/promises");
await writeF("article.pdf", await pdf.save());
console.log(`article.pdf written (${pages.length} page(s), footers stamped)`);
