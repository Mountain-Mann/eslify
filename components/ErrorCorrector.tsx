"use client";

import Link from "next/link";
import { useState } from "react";
import { useUpgrade } from "@/components/UpgradeProvider";
import { useUser } from "@/components/UserProvider";
import { TagRow } from "@/components/TagRow";
import { generateContent, parseSections } from "@/lib/tools";
import { useRotatingMessage } from "@/hooks/useRotatingMessage";
import { correctorPrompt } from "@/lib/openrouter";
import { cleanMarkdown, generatePdf } from "@/lib/pdf";

const WRITING_TYPES = [
  "Essay",
  "Email",
  "Story",
  "Paragraph",
  "Dialogue",
  "Formal letter",
];

const ERROR_FOCUSES = [
  "All errors",
  "Grammar",
  "Vocabulary",
  "Spelling",
  "Punctuation",
  "Register",
];

const LOADER_MSGS = [
  "Analysing student writing…",
  "Identifying errors…",
  "Writing corrections…",
  "Almost ready…",
];

const SECTION_RX =
  /\n(?=CORRECTED VERSION|SUMMARY|ERROR TABLE|LANGUAGE STRENGTHS|TEACHER TIPS)/g;

export default function ErrorCorrector() {
  const { user, refreshUser } = useUser();
  const { showUpgrade } = useUpgrade();

  const [level, setLevel] = useState("B1 — Intermediate");
  const [writingType, setWritingType] = useState("Essay");
  const [errorFocus, setErrorFocus] = useState("All errors");
  const [studentText, setStudentText] = useState("");
  const [notes, setNotes] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correctorText, setCorrectorText] = useState("");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<{ heading: string; content: string }[]>([]);
  const [showResult, setShowResult] = useState(false);

  const loaderMsg = useRotatingMessage(LOADER_MSGS, loading ? 1800 : 999999);
  const outOfCredits = user && !user.isPro && user.creditsRemaining <= 0;

  async function handleGenerate() {
    if (!studentText.trim()) {
      setInputError("Please paste the student's writing before generating.");
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

    const prompt = correctorPrompt({
      level,
      writingType,
      errorFocus,
      studentText: studentText.trim(),
      notes: notes || undefined,
    });

    try {
      const { content: rawContent } = await generateContent(
        "corrector",
        prompt,
        `Error Correction — ${level.split("—")[0].trim()} — ${writingType}`
      );
      const content = cleanMarkdown(rawContent);
      setCorrectorText(content);

      const levelShort = level.split("—")[0].trim();
      setTitle(`Corrections — ${writingType} — ${levelShort}`);

      setSections(parseSections(content, SECTION_RX));
      setShowResult(true);
      await refreshUser();
    } catch (err) {
      const e = err as Error & { status?: number; message?: string };
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
    if (!correctorText) return;
    navigator.clipboard.writeText(correctorText);
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
    if (!correctorText) return;
    const levelShort = level.split("—")[0].trim();
    generatePdf({
      title,
      subtitle: `${levelShort}  •  ${writingType}  •  ${errorFocus}`,
      sections,
      filename: `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
    });
  }

  function renderSection(s: { heading: string; content: string }, i: number) {
    if (s.heading === "ERROR TABLE") {
      const rows = s.content
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.split("|").map((cell) => cell.trim()));

      return (
        <div key={`section-${i}`} className="section">
          <div className="section-label">{s.heading}</div>
          <table className="error-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Error type</th>
                <th>Original</th>
                <th>Corrected</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((cells, ri) => (
                <tr key={ri}>
                  {cells.map((cell, ci) => (
                    <td key={ci}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

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
          <div className="form-title">✍️ Error Corrector</div>
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
            <label>Writing type</label>
            <TagRow
              tags={WRITING_TYPES}
              selected={writingType}
              onSelect={setWritingType}
            />
          </div>
          <div className="field">
            <label>Error focus</label>
            <TagRow
              tags={ERROR_FOCUSES}
              selected={errorFocus}
              onSelect={setErrorFocus}
            />
          </div>
          <div className="field">
            <label>Student writing</label>
            <textarea
              value={studentText}
              onChange={(e) => {
                setStudentText(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="Paste the student's writing here…"
              maxLength={2000}
              rows={8}
            />
            {inputError && (
              <span className="field-error">{inputError}</span>
            )}
          </div>
          <div className="field">
            <label>Teacher notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. first draft, focus on tense errors only…"
              maxLength={300}
            />
          </div>
          <button
            className="btn-main"
            disabled={loading || !!outOfCredits}
            onClick={handleGenerate}
          >
            Correct writing
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
              <div className="empty-icon">✍️</div>
              <p>Paste student writing and generate corrections here.</p>
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
                    <span className="pill pill-green">{writingType}</span>
                    <span className="pill pill-amber">{errorFocus}</span>
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
