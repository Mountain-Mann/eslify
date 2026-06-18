"use client";

import Link from "next/link";
import { useState } from "react";
import { useUpgrade } from "@/components/UpgradeProvider";
import { useUser } from "@/components/UserProvider";
import { TagRow } from "@/components/TagRow";
import { generateContent, parseSections } from "@/lib/tools";
import { useRotatingMessage } from "@/hooks/useRotatingMessage";
import { worksheetPrompt } from "@/lib/openrouter";
import { cleanMarkdown, generatePdf } from "@/lib/pdf";

const WORKSHEET_TYPES = [
  "Mixed exercises",
  "Gap fill exercises",
  "Reading passage with questions",
  "Grammar practice",
  "Vocabulary matching",
  "Discussion questions",
];

const LOADER_MSGS = [
  "Building your worksheet…",
  "Writing exercises…",
  "Formatting for print…",
  "Almost ready…",
];

export default function WorksheetGenerator() {
  const { user, refreshUser } = useUser();
  const { showUpgrade } = useUpgrade();

  const [level, setLevel] = useState("B1 — Intermediate");
  const [focus, setFocus] = useState("Mixed exercises");
  const [topic, setTopic] = useState("");
  const [excount, setExcount] = useState("4 exercises");
  const [answers, setAnswers] = useState("Include answers");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [worksheetText, setWorksheetText] = useState("");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<{ heading: string; content: string }[]>([]);
  const [showResult, setShowResult] = useState(false);

  const loaderMsg = useRotatingMessage(LOADER_MSGS, loading ? 1800 : 999999);
  const outOfCredits = user && !user.isPro && user.creditsRemaining <= 0;

  async function handleGenerate() {
    if (outOfCredits) {
      showUpgrade();
      return;
    }

    setLoading(true);
    setError(null);
    setShowResult(false);

    const prompt = worksheetPrompt({
      level,
      focus,
      topic: topic || "general English",
      exerciseCount: excount,
      includeAnswers: answers === "Include answers",
      notes: notes || undefined,
    });

    try {
      const { content: rawContent } = await generateContent("worksheet", prompt);
      const content = cleanMarkdown(rawContent);
      setWorksheetText(content);

      const titleMatch = content.match(/WORKSHEET TITLE\s*\n+(.+)/i);
      setTitle(
        titleMatch
          ? cleanMarkdown(titleMatch[1].trim())
          : `${topic || "General"} Worksheet`
      );

      const body = content.replace(/WORKSHEET TITLE\s*\n+.+\n?/i, "").trim();
      const sectionRx =
        /\n(?=EXERCISE \d+:|INTRODUCTION|ANSWER KEY|Name:)/g;
      setSections(parseSections(body, sectionRx));
      setShowResult(true);
      await refreshUser();
    } catch (err) {
      const error = err as Error & { status?: number; message?: string };
      if (error.status === 402) {
        showUpgrade();
      } else if (error.status === 429) {
        setError(
          error.message ||
            "You've reached today's generation limit. It resets at midnight."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function copyText() {
    if (!worksheetText) return;
    navigator.clipboard.writeText(worksheetText);
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
    if (!worksheetText) return;

    // Flag the answer key section so the PDF generator forces a page break
    // before it, and skip the redundant "Name: ___ Date: ___" line from
    // the AI body since the PDF already renders a proper student info line.
    const pdfSections = sections
      .filter((s) => !/^name:\s*_+/i.test(s.heading))
      .map((s) => ({
        ...s,
        isAnswerKey: /answer key/i.test(s.heading),
      }));

    generatePdf({
      title,
      subtitle: `${level.split("—")[0].trim()}  •  ${focus}  •  ${excount}`,
      sections: pdfSections,
      studentInfoLine: true,
      filename: `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
    });
  }

  return (
    <>
      <Link href="/" className="back-btn">
        ← Back to tools
      </Link>
      <div className="tool-page">
        <aside className="form-panel">
          <div className="form-title">📄 Worksheet Generator</div>
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
            <label>Worksheet focus</label>
            <TagRow tags={WORKSHEET_TYPES} selected={focus} onSelect={setFocus} />
          </div>
          <div className="field">
            <label>Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. daily routines, environment, food…"
              maxLength={100}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Number of exercises</label>
              <select value={excount} onChange={(e) => setExcount(e.target.value)}>
                <option>3 exercises</option>
                <option>4 exercises</option>
                <option>5 exercises</option>
                <option>6 exercises</option>
              </select>
            </div>
            <div className="field">
              <label>Answer key</label>
              <select
                value={answers}
                onChange={(e) => setAnswers(e.target.value)}
              >
                <option>Include answers</option>
                <option>No answer key</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Extra instructions (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. include a word bank, keep sentences short…"
              maxLength={300}
            />
          </div>
          <button
            className="btn-main"
            disabled={loading || !!outOfCredits}
            onClick={handleGenerate}
          >
            Generate worksheet
          </button>
          {outOfCredits && (
            <div className="credit-warning" style={{ display: "block" }}>
              You&apos;ve used all 5 free credits.{" "}
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
              <div className="empty-icon">📄</div>
              <p>Configure your worksheet and generate it here.</p>
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
                    <span className="pill pill-green">{focus}</span>
                    <span className="pill pill-amber">{excount}</span>
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
                {sections.map((s, i) =>
                  s.content ? (
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
                  ) : s.heading ? (
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
                  ) : null
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}