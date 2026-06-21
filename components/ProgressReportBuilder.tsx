"use client";

import Link from "next/link";
import { useState } from "react";
import { useUpgrade } from "@/components/UpgradeProvider";
import { useUser } from "@/components/UserProvider";
import { TagRow } from "@/components/TagRow";
import { generateContent, parseSections } from "@/lib/tools";
import { useRotatingMessage } from "@/hooks/useRotatingMessage";
import { progressReportPrompt } from "@/lib/openrouter";
import { cleanMarkdown, generatePdf } from "@/lib/pdf";

const REPORT_TYPES = [
  "End of term",
  "Mid-term",
  "Parent meeting",
  "School record",
];

const LOADER_MSGS = [
  "Reviewing your notes…",
  "Writing the report…",
  "Polishing language…",
  "Almost ready…",
];

const SECTION_RX =
  /\n(?=STUDENT OVERVIEW|LANGUAGE PROGRESS|STRENGTHS|AREAS FOR DEVELOPMENT|NEXT STEPS|CLOSING COMMENT)/g;

export default function ProgressReportBuilder() {
  const { user, refreshUser } = useUser();
  const { showUpgrade } = useUpgrade();

  const [teacherNotes, setTeacherNotes] = useState("");
  const [studentName, setStudentName] = useState("");
  const [level, setLevel] = useState("B1 — Intermediate");
  const [reportType, setReportType] = useState("End of term");
  const [reportTone, setReportTone] = useState("Formal");
  const [inputError, setInputError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportText, setReportText] = useState("");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<{ heading: string; content: string }[]>([]);
  const [showResult, setShowResult] = useState(false);

  const loaderMsg = useRotatingMessage(LOADER_MSGS, loading ? 1800 : 999999);
  const outOfCredits = user && !user.isPro && user.creditsRemaining <= 0;

  async function handleGenerate() {
    if (!teacherNotes.trim()) {
      setInputError("Please paste your teacher notes before generating.");
      return;
    }
    setInputError(null);

    if (outOfCredits) {
      showUpgrade();
      return;
    }

    setLoading(true);
    setError(null);
    setShowResult(false);

    const prompt = progressReportPrompt({
      studentName: studentName.trim() || undefined,
      level,
      reportType,
      reportTone,
      teacherNotes: teacherNotes.trim(),
    });

    try {
      const { content: rawContent } = await generateContent("progress", prompt);
      const content = cleanMarkdown(rawContent);
      setReportText(content);

      const levelShort = level.split("—")[0].trim();
      const namepart = studentName.trim() ? ` — ${studentName.trim()}` : "";
      setTitle(`Progress Report${namepart} — ${levelShort}`);

      setSections(parseSections(content, SECTION_RX));
      setShowResult(true);
      await refreshUser();
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 402) {
        showUpgrade();
      } else if (e.status === 429) {
        setError(
          e.message || "You've reached today's generation limit. It resets at midnight."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function copyText() {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
  }

  function handleSectionEdit(
    index: number,
    field: "heading" | "content",
    e: React.FocusEvent<HTMLDivElement>
  ) {
    const newText = e.currentTarget.innerText;
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: newText } : s))
    );
  }

  function handleTitleEdit(e: React.FocusEvent<HTMLDivElement>) {
    setTitle(e.currentTarget.innerText.trim());
  }

  function downloadPdf() {
    if (!reportText) return;
    const levelShort = level.split("—")[0].trim();
    generatePdf({
      title,
      subtitle: `${levelShort}  •  ${reportType}  •  ${reportTone}`,
      sections,
      filename: `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
    });
  }

  function renderSection(s: { heading: string; content: string }, i: number) {
    if (s.content) {
      return (
        <div key={`section-${i}`} className="section">
          <div className="section-label">{s.heading}</div>
          <div
            className="section-content"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleSectionEdit(i, "content", e)}
          >
            {s.content}
          </div>
        </div>
      );
    }

    if (s.heading) {
      return (
        <div key={`section-${i}`} className="section">
          <div
            className="section-content"
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => handleSectionEdit(i, "heading", e)}
          >
            {s.heading}
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <>
      <Link href="/" className="back-btn">
        ← Back to tools
      </Link>
      <div className="tool-page">
        <aside className="form-panel">
          <div className="form-title">📝 Progress Reports</div>
          <div className="field">
            <label>Teacher notes &amp; observations</label>
            <textarea
              value={teacherNotes}
              onChange={(e) => {
                setTeacherNotes(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="Paste your notes, observations, or bullet points about this student…"
              rows={6}
            />
          </div>
          <div className="field">
            <label>Student name (optional)</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="e.g. Maria"
              maxLength={60}
            />
          </div>
          <div className="field">
            <label>Student level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>A1 — Beginner</option>
              <option>A2 — Elementary</option>
              <option>B1 — Intermediate</option>
              <option>B2 — Upper Intermediate</option>
              <option>C1 — Advanced</option>
              <option>C2 — Proficiency</option>
            </select>
          </div>
          <div className="field">
            <label>Report type</label>
            <TagRow
              tags={REPORT_TYPES}
              selected={reportType}
              onSelect={setReportType}
            />
          </div>
          <div className="field">
            <label>Report tone</label>
            <select value={reportTone} onChange={(e) => setReportTone(e.target.value)}>
              <option>Formal</option>
              <option>Semi-formal</option>
              <option>Positive/encouraging</option>
            </select>
          </div>
          {inputError && (
            <span className="field-error">{inputError}</span>
          )}
          <button
            className="btn-main"
            disabled={loading || !!outOfCredits}
            onClick={handleGenerate}
          >
            Generate report
          </button>
          {outOfCredits && (
            <div className="credit-warning" style={{ display: "block" }}>
              You&apos;ve used all 10 free credits this month.{" "}
              <button type="button" onClick={showUpgrade}>
                Upgrade to Pro
              </button>{" "}
              for unlimited generations.
            </div>
          )}
        </aside>

        <section className="output-wrap">
          {!loading && !showResult && !error && (
            <div className="empty">
              <div className="empty-icon">📝</div>
              <p>Paste your teacher notes and generate a professional progress report.</p>
            </div>
          )}
          {loading && (
            <div className="loader">
              <div className="spin" />
              <span>{loaderMsg}</span>
            </div>
          )}
          {error && !loading && (
            <div className="empty">
              <div className="empty-icon">⚠️</div>
              <p>{error}</p>
            </div>
          )}
          {showResult && !loading && (
            <div className="result-card">
              <div className="result-header">
                <div>
                  <div
                    className="result-title"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleTitleEdit}
                  >
                    {title}
                  </div>
                  <div className="pill-row">
                    <span className="pill pill-blue">
                      {level.split("—")[0].trim()}
                    </span>
                    <span className="pill pill-green">{reportType}</span>
                    <span className="pill pill-amber">{reportTone}</span>
                  </div>
                </div>
                <div className="result-actions">
                  <button className="btn-sm" onClick={downloadPdf}>
                    Download PDF
                  </button>
                  <button className="btn-sm" onClick={copyText}>
                    Copy
                  </button>
                </div>
              </div>
              <p className="edit-hint">Click any text below to edit it.</p>
              <div className="result-body">
                {sections.map((s, i) => renderSection(s, i))}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
