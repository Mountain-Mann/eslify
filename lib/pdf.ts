// lib/pdf.ts
// Markdown cleanup + real client-side PDF generation using jsPDF.
// Run: npm install jspdf

import jsPDF from "jspdf";

/**
 * Strips common markdown artifacts that sometimes leak through from the
 * AI model despite prompt instructions. Converts to clean plain text /
 * simple bullets so the UI never shows literal *, #, ` symbols.
 */
export function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1") // bold italic
    .replace(/\*\*(.+?)\*\*/g, "$1") // bold
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, "$1") // italic (single asterisk)
    .replace(/^#{1,6}\s+/gm, "") // headers
    .replace(/^[-*]\s+/gm, "• ") // markdown bullets -> real bullet char
    .replace(/`{1,3}([^`]+?)`{1,3}/g, "$1") // inline / block code ticks
    .replace(/^>\s+/gm, "") // blockquote markers
    .replace(/_{2}(.+?)_{2}/g, "$1") // underscores used as bold
    .replace(/_(.+?)_/g, "$1") // underscores used as italic
    .trim();
}

export interface PdfSection {
  heading: string;
  content: string;
  isAnswerKey?: boolean;
}

interface GeneratePdfOptions {
  title: string;
  subtitle?: string; // e.g. level / type / duration pills as one line
  sections: PdfSection[];
  studentInfoLine?: boolean; // adds Name/Date/Class line for worksheets
  filename: string;
}

const PAGE_WIDTH = 595.28; // A4 in pt
const PAGE_HEIGHT = 841.89;
const MARGIN = 56; // ~0.78in
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 14;

/**
 * Generates a clean, real PDF (not a page screenshot) from structured
 * lesson/worksheet sections. Answer key sections are forced onto a new
 * page automatically.
 *
 * IMPORTANT: every text draw call renders ONE line at a time (never an
 * array of lines passed to doc.text()) and re-asserts font/size/color
 * immediately before drawing. Passing wrapped-line arrays directly to
 * jsPDF's text() has been observed to occasionally corrupt glyph spacing
 * on some lines (rendering as letter-by-letter with stray characters
 * between each one) when font state changes earlier in the same
 * document. Rendering defensively, line by line, avoids that class of
 * bug entirely.
 */
export function generatePdf({
  title,
  subtitle,
  sections,
  studentInfoLine,
  filename,
}: GeneratePdfOptions): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Draws a single already-measured line, re-asserting font state first.
  const drawLine = (
    line: string,
    x: number,
    font: "helvetica",
    style: "normal" | "bold",
    size: number,
    color: [number, number, number]
  ) => {
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(line, x, y, { align: 'left' });
  };

  // Wraps text and draws every resulting line individually.
  const drawWrapped = (
    text: string,
    x: number,
    width: number,
    style: "normal" | "bold",
    size: number,
    color: [number, number, number]
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(text, width);
    for (const line of lines) {
      ensureSpace(LINE_HEIGHT + 2);
      drawLine(line, x, "helvetica", style, size, color);
      y += LINE_HEIGHT;
    }
  };

  // Title
  drawWrapped(title, MARGIN, CONTENT_WIDTH, "bold", 18, [20, 20, 20]);
  y += 6;

  // Subtitle (level / type / duration)
  if (subtitle) {
    drawWrapped(subtitle, MARGIN, CONTENT_WIDTH, "normal", 10, [110, 110, 110]);
    y += 8;
  }

  // Student info line
  if (studentInfoLine) {
    ensureSpace(30);
    drawLine(
      "Name: _______________________   Date: _____________   Class: ___________",
      MARGIN,
      "helvetica",
      "normal",
      11,
      [20, 20, 20]
    );
    y += 26;
  }

  // Divider
  doc.setDrawColor(220, 220, 220);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 20;

  for (const section of sections) {
    if (!section.heading && !section.content) continue;

    // Force answer key onto a fresh page
    if (section.isAnswerKey) {
      doc.addPage();
      y = MARGIN;
    } else {
      ensureSpace(40);
    }

    if (section.heading) {
      ensureSpace(18);
      drawLine(
        section.heading.toUpperCase(),
        MARGIN,
        "helvetica",
        "bold",
        11,
        [46, 93, 75] // brand-ish green, matches app accent
      );
      y += 8;
      doc.setDrawColor(232, 242, 238);
      doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
      y += 14;
    }

    if (section.content) {
      const cleaned = cleanMarkdown(section.content);
      const paragraphs = cleaned.split("\n");

      for (const rawPara of paragraphs) {
        if (!rawPara.trim()) {
          y += 8;
          continue;
        }

        // Detect a leading indent (used for "a) b) c)" style sub-options
        // that the model sometimes puts on an indented continuation line).
        const indentMatch = rawPara.match(/^(\s{2,})/);
        const indentPt = indentMatch ? 18 : 0;
        const para = rawPara.trim();
        const availWidth = CONTENT_WIDTH - indentPt;

        // If a line contains multiple lettered options separated by
        // multiple spaces (e.g. "a) menu   b) chair   c) floor"), force
        // each option onto its own visual line.
        const optionSplit = para.split(/(?<=\))\s{2,}(?=[a-d]\))/i);
        const piecesToRender =
          optionSplit.length > 1 ? optionSplit : [para];

        for (const piece of piecesToRender) {
          drawWrapped(
            piece,
            MARGIN + indentPt,
            availWidth,
            "normal",
            11,
            [20, 20, 20]
          );
          y += 2;
        }
      }
    }

    y += 14; // space between sections
  }

  doc.save(filename);
}