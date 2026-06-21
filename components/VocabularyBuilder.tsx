"use client";

import Link from "next/link";
import { useState } from "react";
import { useUpgrade } from "@/components/UpgradeProvider";
import { useUser } from "@/components/UserProvider";
import { TagRow } from "@/components/TagRow";
import { generateContent, parseSections } from "@/lib/tools";
import { useRotatingMessage } from "@/hooks/useRotatingMessage";
import { vocabularyPrompt } from "@/lib/openrouter";
import { cleanMarkdown, generatePdf } from "@/lib/pdf";

const FOCUS_TYPES = [
  "General vocabulary",
  "Academic vocabulary",
  "Business/professional",
  "Phrasal verbs",
  "Idioms & expressions",
  "Collocations",
];

const WORD_COUNTS = ["10", "15", "20", "25"];

const INCLUDE_OPTIONS = [
  "Definitions",
  "Example sentences",
  "Collocations",
  "Part of speech",
  "Pronunciation guide",
];

const LOADER_MSGS = [
  "Selecting vocabulary…",
  "Writing definitions…",
  "Adding example sentences…",
  "Almost ready…",
];

const SECTION_RX =
  /\n(?=VOCABULARY LIST|TEACHING NOTES|PRACTICE IDEAS|EXTENSION WORDS)/g;

export default function VocabularyBuilder() {
  const { user, refreshUser } = useUser();
  const { showUpgrade } = useUpgrade();

  const [level, setLevel] = useState("B1 — Intermediate");
  const [topic, setTopic] = useState("");
  const [wordCount, setWordCount] = useState("15");
  const [focusType, setFocusType] = useState("General vocabulary");
  const [includes, setIncludes] = useState<string[]>([
    "Definitions",
    "Example sentences",
  ]);
  const [inputError, setInputError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vocabText, setVocabText] = useState("");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<{ heading: string; content: string }[]>([]);
  const [showResult, setShowResult] = useState(false);

  const loaderMsg = useRotatingMessage(LOADER_MSGS, loading ? 1800 : 999999);
  const outOfCredits = user && !user.isPro && user.creditsRemaining <= 0;

  function toggleInclude(opt: string) {
    setIncludes((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  }

  async function handleGenerate() {
    if (!topic.trim()) {
      setInputError("Please enter a topic before generating.");
      return;
    }
    if (includes.length === 0) {
      setInputError("Please select at least one item to include.");
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

    // Cap word count for free users to avoid token truncation
    const effectiveWordCount =
      (!user || !user.isPro) && parseInt(wordCount) > 15 ? "15" : wordCount;

    const prompt = vocabularyPrompt({
      level,
      topic: topic.trim(),
      wordCount: effectiveWordCount,
      focusType,
      includes,
    });

    try {
      const { content: rawContent } = await generateContent(
        "vocabulary",
        prompt,
        `Vocabulary — ${level.split("—")[0].trim()} — ${topic.trim()}`
      );
      const content = cleanMarkdown(rawContent);
      setVocabText(content);

      const levelShort = level.split("—")[0].trim();
      setTitle(`Vocabulary — ${topic.trim()} — ${levelShort}`);

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
    if (!vocabText) return;
    navigator.clipboard.writeText(vocabText);
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
    if (!vocabText) return;
    const levelShort = level.split("—")[0].trim();
    generatePdf({
      title,
      subtitle: `${levelShort}  •  ${focusType}  •  ${wordCount} words`,
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
          <div className="form-title">📚 Vocabulary Builder</div>
          <div className="field">
            <label>Topic or theme</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (inputError) setInputError(null);
              }}
              placeholder="e.g. travel, technology, the environment…"
              maxLength={80}
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
            <label>Word count</label>
            <select value={wordCount} onChange={(e) => setWordCount(e.target.value)}>
              {WORD_COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n} words
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Focus type</label>
            <TagRow
              tags={FOCUS_TYPES}
              selected={focusType}
              onSelect={setFocusType}
            />
          </div>
          <div className="field">
            <label>Include</label>
            <div className="tag-row">
              {INCLUDE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`tag${includes.includes(opt) ? " on" : ""}`}
                  onClick={() => toggleInclude(opt)}
                >
                  {opt.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
          {inputError && (
            <span className="field-error">{inputError}</span>
          )}
          <button
            className="btn-main"
            disabled={loading || !!outOfCredits}
            onClick={handleGenerate}
          >
            Generate vocabulary list
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
              <div className="empty-icon">📚</div>
              <p>Enter a topic and generate your vocabulary list here.</p>
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
                    <span className="pill pill-green">{focusType}</span>
                    <span className="pill pill-amber">{wordCount} words</span>
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
