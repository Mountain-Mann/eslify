"use client";

import Link from "next/link";
import { useState } from "react";
import { useUpgrade } from "@/components/UpgradeProvider";
import { useUser } from "@/components/UserProvider";
import { TagRow } from "@/components/TagRow";
import { generateContent, parseSections } from "@/lib/tools";
import { useRotatingMessage } from "@/hooks/useRotatingMessage";
import { lessonPrompt, checkerPrompt } from "@/lib/openrouter";
import { cleanMarkdown, generatePdf } from "@/lib/pdf";

const LESSON_TYPES = [
  "Speaking & conversation",
  "Reading comprehension",
  "Grammar focus",
  "Writing skills",
  "Listening",
  "Vocabulary building",
];

const LOADER_MSGS = [
  "Writing your lesson plan…",
  "Structuring activities…",
  "Adding timing and materials…",
  "Almost ready…",
];

export default function LessonPlanner() {
  const { user, refreshUser } = useUser();
  const { showUpgrade } = useUpgrade();

  const [level, setLevel] = useState("B1 — Intermediate");
  const [type, setType] = useState("Speaking & conversation");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState("45 minutes");
  const [classSize, setClassSize] = useState("Small group");
  const [goals, setGoals] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonText, setLessonText] = useState("");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<{ heading: string; content: string }[]>([]);
  const [showResult, setShowResult] = useState(false);

  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    scores: Record<string, number>;
    overall: number;
    feedback: { type: string; text: string }[];
  } | null>(null);
  const [showChecker, setShowChecker] = useState(false);

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
    setShowChecker(false);
    setCheckResult(null);

    const prompt = lessonPrompt({
      level,
      type,
      topic: topic || "general conversation",
      duration,
      classSize,
      goals: goals || undefined,
    });

    try {
      const { content: rawContent } = await generateContent("lesson", prompt);
      const content = cleanMarkdown(rawContent);
      setLessonText(content);

      const titleMatch = content.match(/LESSON TITLE\s*\n+(.+)/i);
      setTitle(
        titleMatch
          ? cleanMarkdown(titleMatch[1].trim())
          : `${topic || "Lesson"} — ${type}`
      );

      const body = content.replace(/LESSON TITLE\s*\n+.+\n?/i, "").trim();
      const sectionRx = /\n(?=[A-Z][A-Z\s&\-\/()]+\n)/g;
      setSections(parseSections(body, sectionRx));
      setShowResult(true);
      setShowChecker(true);
      await refreshUser();
    } catch (err) {
      const error = err as Error & { status?: number };
      if (error.status === 402) {
        showUpgrade();
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleCheck() {
    if (!lessonText || !user?.isPro) return;
    setChecking(true);

    const prompt = checkerPrompt(lessonText);

    try {
      const { content } = await generateContent("check", prompt);
      const clean = content.replace(/```json|```/g, "").trim();
      setCheckResult(JSON.parse(clean));
    } catch {
      // silently fail
    } finally {
      setChecking(false);
    }
  }

  function copyText() {
    if (!lessonText) return;
    navigator.clipboard.writeText(lessonText);
  }

  function downloadPdf() {
    if (!lessonText) return;
    generatePdf({
      title,
      subtitle: `${level.split("—")[0].trim()}  •  ${type}  •  ${duration}`,
      sections,
      filename: `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
    });
  }

  // Called when the user clicks away from an edited section. Updates the
  // section's content in state so both the on-screen view and the PDF
  // export reflect the edit. We read from e.currentTarget rather than
  // tracking onChange per keystroke to avoid fighting React's render
  // cycle while contentEditable is focused.
  function handleSectionEdit(
    index: number,
    e: React.FocusEvent<HTMLDivElement>
  ) {
    const newContent = e.currentTarget.innerText;
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, content: newContent } : s))
    );
  }

  function handleTitleEdit(e: React.FocusEvent<HTMLDivElement>) {
    setTitle(e.currentTarget.innerText.trim());
  }

  const scoreClass = (v: number) =>
    v >= 80 ? "good" : v >= 60 ? "mid" : "bad";

  return (
    <>
      <Link href="/" className="back-btn">
        ← Back to tools
      </Link>
      <div className="tool-page">
        <aside className="form-panel">
          <div className="form-title">📋 Lesson Planner</div>
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
            <label>Lesson type</label>
            <TagRow tags={LESSON_TYPES} selected={type} onSelect={setType} />
          </div>
          <div className="field">
            <label>Topic or theme</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. job interviews, travel, climate…"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option>30 minutes</option>
                <option>45 minutes</option>
                <option>60 minutes</option>
                <option>90 minutes</option>
              </select>
            </div>
            <div className="field">
              <label>Class size</label>
              <select
                value={classSize}
                onChange={(e) => setClassSize(e.target.value)}
              >
                <option>1-to-1</option>
                <option>Small group</option>
                <option>Class (9–20)</option>
                <option>Large class</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Specific goals (optional)</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="e.g. practise past perfect, airport vocabulary…"
            />
          </div>
          <button
            className="btn-main"
            disabled={loading || !!outOfCredits}
            onClick={handleGenerate}
          >
            Generate lesson plan
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
              <div className="empty-icon">📋</div>
              <p>Fill in the settings and generate your lesson plan.</p>
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
            <div className="result-card" id="lesson-print-area">
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
                    <span className="pill pill-green">{type}</span>
                    <span className="pill pill-amber">{duration}</span>
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

          {showChecker && showResult && (
            <div className="checker">
              <div className="checker-head">
                <h3>✦ Quality checker</h3>
                {user?.isPro ? (
                  <button
                    className="btn-check"
                    disabled={checking}
                    onClick={handleCheck}
                  >
                    {checking
                      ? "Checking…"
                      : checkResult
                        ? "Re-check"
                        : "Check this lesson"}
                  </button>
                ) : null}
              </div>
              {!user?.isPro ? (
                <div className="checker-pro-upsell">
                  Quality checker is a Pro feature.{" "}
                  <button type="button" onClick={showUpgrade}>
                    Upgrade to Pro
                  </button>{" "}
                  to get AI feedback on your lesson plans.
                </div>
              ) : checkResult ? (
                <div className="checker-body" style={{ display: "block" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      marginBottom: "1rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-syne), sans-serif",
                        fontSize: 38,
                        fontWeight: 800,
                        color: "var(--ink)",
                      }}
                    >
                      {checkResult.overall}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>
                      overall score
                    </span>
                  </div>
                  <div className="scores">
                    {Object.entries(checkResult.scores).map(([k, v]) => (
                      <div key={k} className="score-box">
                        <div className={`score-n ${scoreClass(v)}`}>{v}</div>
                        <div className="score-l">{k.replace(/_/g, " ")}</div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--amber)",
                      marginBottom: 8,
                      paddingBottom: 5,
                      borderBottom: "1px solid var(--amber-border)",
                    }}
                  >
                    Feedback
                  </div>
                  {checkResult.feedback.map((f, i) => {
                    const icons: Record<string, string> = {
                      ok: "✓",
                      warn: "!",
                      tip: "★",
                    };
                    return (
                      <div key={i} className="fb-item">
                        <div className={`fb-dot ${f.type}`}>
                          {icons[f.type]}
                        </div>
                        <div>{f.text}</div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </>
  );
}