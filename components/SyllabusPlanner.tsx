"use client";

import Link from "next/link";
import { useState } from "react";
import { useUpgrade } from "@/components/UpgradeProvider";
import { useUser } from "@/components/UserProvider";
import { generateContent, parseSections } from "@/lib/tools";
import { useRotatingMessage } from "@/hooks/useRotatingMessage";
import { syllabusPrompt } from "@/lib/openrouter";
import { cleanMarkdown, generatePdf } from "@/lib/pdf";

const LOADER_MSGS = [
  "Planning your course…",
  "Sequencing topics…",
  "Writing weekly breakdowns…",
  "Almost ready…",
];

const SECTION_RX = /\n(?=COURSE TITLE|COURSE OVERVIEW|WEEK \d+|ASSESSMENT PLAN|RECOMMENDED RESOURCES)/g;

export default function SyllabusPlanner() {
  const { user, refreshUser } = useUser();
  const { showUpgrade } = useUpgrade();

  const [level, setLevel] = useState("B1 — Intermediate");
  const [numWeeks, setNumWeeks] = useState("8");
  const [hoursPerWeek, setHoursPerWeek] = useState("3–4 hours");
  const [topic, setTopic] = useState("");
  const [goals, setGoals] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syllabusText, setSyllabusText] = useState("");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<{ heading: string; content: string }[]>([]);
  const [showResult, setShowResult] = useState(false);

  const loaderMsg = useRotatingMessage(LOADER_MSGS, loading ? 1800 : 999999);
  const outOfCredits = user && !user.isPro && user.creditsRemaining <= 0;

  async function handleGenerate() {
    if (!topic.trim()) {
      setInputError("Please enter a course topic before generating.");
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

    const prompt = syllabusPrompt({
      level,
      numWeeks,
      hoursPerWeek,
      topic: topic.trim(),
      goals: goals.trim() || undefined,
    });

    try {
      const { content: rawContent } = await generateContent(
        "syllabus",
        prompt,
        `Syllabus — ${level.split("—")[0].trim()} — ${numWeeks} weeks — ${topic.trim()}`
      );
      const content = cleanMarkdown(rawContent);
      setSyllabusText(content);

      const titleMatch = content.match(/COURSE TITLE\s*\n+(.+)/i);
      setTitle(
        titleMatch
          ? cleanMarkdown(titleMatch[1].trim())
          : `${topic.trim()} — ${numWeeks}-Week Course`
      );

      const body = content.replace(/COURSE TITLE\s*\n+.+\n?/i, "").trim();
      setSections(parseSections(body, SECTION_RX));
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
    if (!syllabusText) return;
    navigator.clipboard.writeText(syllabusText);
  }

  function handleSectionEdit(index: number, e: React.FocusEvent<HTMLDivElement>) {
    const newContent = e.currentTarget.innerText;
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, content: newContent } : s))
    );
  }

  function handleTitleEdit(e: React.FocusEvent<HTMLDivElement>) {
    setTitle(e.currentTarget.innerText.trim());
  }

  function downloadPdf() {
    if (!syllabusText) return;
    generatePdf({
      title,
      subtitle: `${level.split("—")[0].trim()}  •  ${numWeeks} weeks  •  ${hoursPerWeek}`,
      sections,
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
          <div className="form-title">📅 Syllabus Planner</div>
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
            <label>Course topic / focus</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="e.g. Business English, Cambridge B2 prep, conversation skills…"
              maxLength={100}
            />
            {inputError && <span className="field-error">{inputError}</span>}
          </div>
          <div className="field-row">
            <div className="field">
              <label>Course length</label>
              <select value={numWeeks} onChange={(e) => setNumWeeks(e.target.value)}>
                <option value="6">6 weeks</option>
                <option value="8">8 weeks</option>
                <option value="10">10 weeks</option>
                <option value="12">12 weeks</option>
                <option value="16">16 weeks</option>
                <option value="20">20 weeks</option>
              </select>
            </div>
            <div className="field">
              <label>Hours per week</label>
              <select value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)}>
                <option>1–2 hours</option>
                <option>3–4 hours</option>
                <option>5–6 hours</option>
                <option>Intensive (10+)</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Course goals (optional)</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g. prepare for IELTS, improve business writing, pass Cambridge B1…"
              maxLength={300}
            />
          </div>
          <button
            className="btn-main"
            disabled={loading || !!outOfCredits}
            onClick={handleGenerate}
          >
            Generate syllabus
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
              <div className="empty-icon">📅</div>
              <p>Configure your course and generate a week-by-week syllabus.</p>
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
                    <span className="pill pill-green">{numWeeks} weeks</span>
                    <span className="pill pill-amber">{hoursPerWeek}</span>
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
                        onBlur={(e) => handleSectionEdit(i, e)}
                      >
                        {s.content}
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
