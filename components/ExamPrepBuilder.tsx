"use client";

import Link from "next/link";
import { useState } from "react";
import { useUpgrade } from "@/components/UpgradeProvider";
import { useUser } from "@/components/UserProvider";
import { generateContent, parseSections } from "@/lib/tools";
import { useRotatingMessage } from "@/hooks/useRotatingMessage";
import { examPrepPrompt } from "@/lib/openrouter";
import { cleanMarkdown, generatePdf } from "@/lib/pdf";

const IELTS_TASK_TYPES = [
  "Reading (True/False/NG)",
  "Reading (Multiple Choice)",
  "Listening (Gap Fill)",
  "Writing Task 1 (Academic)",
  "Writing Task 1 (General)",
  "Writing Task 2 Essay",
  "Speaking Part 1",
  "Speaking Part 2",
  "Speaking Part 3",
];

const TOEFL_TASK_TYPES = [
  "Reading (Multiple Choice)",
  "Listening (Note-taking)",
  "Integrated Writing",
  "Independent Writing",
  "Speaking (Independent)",
  "Speaking (Integrated)",
];

const LEVELS = [
  "B1 — Intermediate",
  "B2 — Upper Intermediate",
  "C1 — Advanced",
  "C2 — Proficiency",
];

const LOADER_MSGS = [
  "Designing the task…",
  "Writing questions…",
  "Adding answer key…",
  "Almost ready…",
];

const SECTION_RX =
  /\n(?=TASK TITLE|EXAM OVERVIEW|INSTRUCTIONS|TASK CONTENT|ANSWER KEY|TEACHER NOTES)/g;

export default function ExamPrepBuilder() {
  const { user, refreshUser } = useUser();
  const { showUpgrade } = useUpgrade();

  const [examType, setExamType] = useState<"IELTS" | "TOEFL">("IELTS");
  const [taskType, setTaskType] = useState(IELTS_TASK_TYPES[0]);
  const [level, setLevel] = useState("B2 — Upper Intermediate");
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [examText, setExamText] = useState("");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<{ heading: string; content: string }[]>([]);
  const [showResult, setShowResult] = useState(false);

  const loaderMsg = useRotatingMessage(LOADER_MSGS, loading ? 1800 : 999999);
  const outOfCredits = user && !user.isPro && user.creditsRemaining <= 0;

  function handleExamTypeChange(type: "IELTS" | "TOEFL") {
    setExamType(type);
    setTaskType(type === "IELTS" ? IELTS_TASK_TYPES[0] : TOEFL_TASK_TYPES[0]);
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setInputError("Please enter a topic before generating.");
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

    const prompt = examPrepPrompt({
      examType,
      taskType,
      level,
      topic: topic.trim(),
      notes: notes.trim() || undefined,
    });

    try {
      const { content: rawContent } = await generateContent("exam", prompt);
      const content = cleanMarkdown(rawContent);
      setExamText(content);

      const levelShort = level.split("—")[0].trim();
      setTitle(`${examType} — ${taskType} — ${levelShort}`);

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
    if (!examText) return;
    navigator.clipboard.writeText(examText);
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
    if (!examText) return;
    const levelShort = level.split("—")[0].trim();
    generatePdf({
      title,
      subtitle: `${examType}  •  ${taskType}  •  ${levelShort}`,
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

  const taskTypes = examType === "IELTS" ? IELTS_TASK_TYPES : TOEFL_TASK_TYPES;

  return (
    <>
      <Link href="/" className="back-btn">
        ← Back to tools
      </Link>
      <div className="tool-page">
        <aside className="form-panel">
          <div className="form-title">🎓 Exam Prep Builder</div>
          <div className="field">
            <label>Exam type</label>
            <div className="tag-row">
              {(["IELTS", "TOEFL"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`tag${examType === type ? " on" : ""}`}
                  onClick={() => handleExamTypeChange(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Task type</label>
            <select value={taskType} onChange={(e) => setTaskType(e.target.value)}>
              {taskTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Student level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="e.g. climate change, urbanisation, health…"
              maxLength={80}
            />
          </div>
          <div className="field">
            <label>Additional notes <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. focus on academic vocabulary"
              maxLength={120}
            />
          </div>
          {inputError && (
            <span className="field-error">{inputError}</span>
          )}
          <button
            className="btn-main"
            disabled={loading || !!outOfCredits}
            onClick={handleGenerate}
          >
            Generate exam task
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
              <div className="empty-icon">🎓</div>
              <p>Choose an exam type and task, then generate your practice material here.</p>
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
                    <span className="pill pill-blue">{examType}</span>
                    <span className="pill pill-green">{taskType}</span>
                    <span className="pill pill-amber">{level.split("—")[0].trim()}</span>
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
