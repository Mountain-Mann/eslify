// lib/pdf.ts
// Markdown cleanup + browser-native print-to-PDF (no jsPDF).
// The browser renders HTML directly — zero font-metric mismatch.

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
    .replace(/ /g, " ") // non-breaking space → regular space
    .replace(/[–—]/g, "-") // en/em dash → hyphen
    .trim();
}

export interface PdfSection {
  heading: string;
  content: string;
  isAnswerKey?: boolean;
}

interface GeneratePdfOptions {
  title: string;
  subtitle?: string;
  sections: PdfSection[];
  studentInfoLine?: boolean;
  filename: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Opens a print window containing the document as HTML and triggers the
 * browser's native print-to-PDF dialog. The browser uses its own font
 * rendering — no jsPDF metric tables, no font substitution mismatch.
 */
export function generatePdf({
  title,
  subtitle,
  sections,
  studentInfoLine,
}: GeneratePdfOptions): void {
  const sectionsHtml = sections
    .map((s) => {
      if (!s.heading && !s.content) return "";

      const pageBreak = s.isAnswerKey
        ? ' style="page-break-before: always; padding-top: 8px;"'
        : "";

      let html = `<div class="section"${pageBreak}>`;

      if (s.heading) {
        html += `<div class="section-heading">${escapeHtml(s.heading.toUpperCase())}</div>`;
        html += `<hr class="section-rule" />`;
      }

      if (s.content) {
        const paragraphs = s.content.split("\n");
        for (const para of paragraphs) {
          if (!para.trim()) {
            html += `<div class="spacer"></div>`;
          } else {
            html += `<p>${escapeHtml(para.trim())}</p>`;
          }
        }
      }

      html += `</div>`;
      return html;
    })
    .join("");

  const studentInfoHtml = studentInfoLine
    ? `<div class="student-info">Name: _______________________&nbsp;&nbsp;&nbsp;Date: _____________&nbsp;&nbsp;&nbsp;Class: ___________</div>`
    : "";

  const subtitleHtml = subtitle
    ? `<div class="subtitle">${escapeHtml(subtitle)}</div>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page {
    size: A4;
    margin: 20mm;
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 11pt;
    color: #141414;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  h1 {
    font-size: 18pt;
    font-weight: bold;
    margin-bottom: 4px;
    color: #141414;
  }
  .subtitle {
    font-size: 10pt;
    color: #6e6e6e;
    margin-bottom: 10px;
  }
  .student-info {
    font-size: 11pt;
    margin-bottom: 14px;
  }
  hr.main-rule {
    border: none;
    border-top: 1px solid #dcdcdc;
    margin-bottom: 18px;
  }
  .section {
    margin-bottom: 16px;
  }
  .section-heading {
    font-size: 11pt;
    font-weight: bold;
    color: #2e5d4b;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  hr.section-rule {
    border: none;
    border-top: 1px solid #e8f2ee;
    margin-bottom: 10px;
  }
  p {
    margin-bottom: 4px;
  }
  .spacer {
    height: 8px;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${subtitleHtml}
${studentInfoHtml}
<hr class="main-rule" />
${sectionsHtml}
<script>
  window.onload = function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  };
</script>
</body>
</html>`;

  const printWin = window.open("", "_blank");
  if (!printWin) return;
  printWin.document.write(html);
  printWin.document.close();
}
