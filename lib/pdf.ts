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
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2 - 4;

/**
 * Generates a clean, real PDF (not a page screenshot) from structured
 * lesson/worksheet sections. Answer key sections are forced onto a new
 * page automatically.
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

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(title, CONTENT_WIDTH);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 22 + 4;

  // Subtitle (level / type / duration)
  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(subtitle, MARGIN, y);
    doc.setTextColor(20, 20, 20);
    y += 18;
  }

  // Student info line
  if (studentInfoLine) {
    ensureSpace(30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Name: _______________________   Date: _____________   Class: ___________", MARGIN, y);
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
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(46, 93, 75); // brand-ish green, matches app accent
      const headingText = section.heading.toUpperCase();
      ensureSpace(18);
      doc.text(headingText, MARGIN, y);
      doc.setTextColor(20, 20, 20);
      y += 8;
      doc.setDrawColor(232, 242, 238);
      doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
      y += 14;
    }

    if (section.content) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const cleaned = cleanMarkdown(section.content);
      const paragraphs = cleaned.split("\n");

      for (const para of paragraphs) {
        if (!para.trim()) {
          y += 8;
          continue;
        }
        const lines = doc.splitTextToSize(para, CONTENT_WIDTH);
        ensureSpace(lines.length * 14 + 4);
        doc.text(lines, MARGIN, y);
        y += lines.length * 14 + 4;
      }
    }

    y += 14; // space between sections
  }

  doc.save(filename);
}