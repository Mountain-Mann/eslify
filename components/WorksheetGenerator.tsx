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

const LEVELS = [
  "A1 — Beginner",
  "A2 — Elementary",
  "B1 — Intermediate",
  "B2 — Upper Intermediate",
  "C1 — Advanced",
  "C2 — Proficiency",
];

const LEVEL_CODES = ["A1", "A2", "B1", "B2", "C1", "C2"];

const LOADER_MSGS = [
  "Building your worksheet…",
  "Writing exercises…",
  "Formatting for print…",
  "Almost ready…",
];

const SECTION_RX = /\n(?=EXERCISE \d+:|INTRODUCTION|ANSWER KEY|Name:)/g;

interface LevelResult {
  level: string;
  title: string;
  sections: { heading: string; content: string }[];
  text: string;
}

export default function WorksheetGenerator() {
  const { user, refreshUser } = useUser();
  const { showUpgrade } = useUpgrade();

  const [level, setLevel] = useState("B1 — Intermediate");
  const [focus, setFocus] = useState("Mixed exercises");
  const [topic, setTopic] = useState("");
  const [excount, setExcount] = useState("4 exercises");
  const [answers, setAnswers] = useState("Include answers");
  const [notes, setNotes] = useState("");

  // Differentiation mode
  const [multiLevel, setMultiLevel] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<string[]>(["B1 — Intermediate"]);
  const [levelResults, setLevelResults] = useState<LevelResult[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [worksheetText, setWorksheetText] = useState("");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<{ heading: string; content: string }[]>([]);
  const [showResult, setShowResult] = useState(false);

  const loaderMsg = useRotatingMessage(LOADER_MSGS, loading ? 1800 : 999999);
  const outOfCredits = user && !user.isPro && user.creditsRemaining <= 0;

  function toggleMultiLevel() {
    if (!user?.isPro) {
      showUpgrade();
      return;
    }
    setMultiLevel((v) => {
      if (!v) setSelectedLevels([level]);
      return !v;
    });
    setShowResult(false);
    setLevelResults([]);
  }

  function toggleLevel(lvl: string) {
    setSelectedLevels((prev) => {
      if (prev.includes(lvl)) {
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== lvl);
      }
      if (prev.length >= 3) return prev;
      return [...prev, lvl];
    });
  }

  function parseSingleWorksheet(raw: string) {
    const content = cleanMarkdown(raw);
    const titleMatch = content.match(/WORKSHEET TITLE\s*\n+(.+)/i);
    const t = titleMatch
      ? cleanMarkdown(titleMatch[1].trim())
      : `${topic || "General"} Worksheet`;
    const body = content.replace(/WORKSHEET TITLE\s*\n+.+\n?/i, "").trim();
    const s = parseSections(body, SECTION_RX);
    return { title: t, sections: s, text: content };
  }

  async function handleGenerate() {
    if (outOfCredits) {
      showUpgrade();
      return;
    }

    setLoading(true);
    setError(null);
    setShowResult(false);
    setLevelResults([]);

    if (multiLevel && selectedLevels.length > 1) {
      try {
        const results = await Promise.all(
          selectedLevels.map(async (lvl) => {
            const prompt = worksheetPrompt({
              level: lvl,
              focus,
              topic: topic || "general English",
              exerciseCount: excount,
              includeAnswers: answers === "Include answers",
              notes: notes || undefined,
            });
            const { content: raw } = await generateContent(
              "worksheet",
              prompt,
              `Worksheet — ${lvl.split("—")[0].trim()} — ${focus}${topic ? ` — ${topic}` : ""}`
            );
            const { title: t, sections: s, text } = parseSingleWorksheet(raw);
            return { level: lvl, title: t, sections: s, text };
          })
        );
        setLevelResults(results);
        setActiveTab(0);
        setShowResult(true);
        await refreshUser();
      } catch (err) {
        const e = err as Error & { status?: number; message?: string };
        if (e.status === 402) {
          showUpgrade();
        } else if (e.status === 429) {
          setError(e.message || "You've reached today's generation limit. It resets at midnight.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    // Single level
    const prompt = worksheetPrompt({
      level,
      focus,
      topic: topic || "general English",
      exerciseCount: excount,
      includeAnswers: answers === "Include answers",
      notes: notes || undefined,
    });

    try {
      const { content: raw } = await generateContent(
        "worksheet",
        prompt,
        `Worksheet — ${level.split("—")[0].trim()} — ${focus}${topic ? ` — ${topic}` : ""}`
      );
      const { title: t, sections: s, text } = parseSingleWorksheet(raw);
      setWorksheetText(text);
      setTitle(t);
      setSections(s);
      setShowResult(true);
      await refreshUser();
    } catch (err) {
      const error = err as Error & { status?: number; message?: string };
      if (error.status === 402) {
        showUpgrade();
      } else if (error.status === 429) {
        setError(error.message || "You've reached today's generation limit. It resets at midnight.");
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

  function copyTabText() {
    const r = levelResults[activeTab];
    if (r) navigator.clipboard.writeText(r.text);
  }

  function handleSectionEdit(index: number, field: "heading" | "content", e: React.FocusEvent<HTMLDivElement>) {
    const newText = e.currentTarget.innerText;
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: newText } : s)));
  }

  function handleTabSectionEdit(index: number, field: "heading" | "content", e: React.FocusEvent<HTMLDivElement>) {
    const newText = e.currentTarget.innerText;
    setLevelResults((prev) =>
      prev.map((r, ri) =>
        ri === activeTab
          ? { ...r, sections: r.sections.map((s, si) => (si === index ? { ...s, [field]: newText } : s)) }
          : r
      )
    );
  }

  function handleTitleEdit(e: React.FocusEvent<HTMLDivElement>) {
    setTitle(e.currentTarget.innerText.trim());
  }

  function handleTabTitleEdit(e: React.FocusEvent<HTMLDivElement>) {
    const newTitle = e.currentTarget.innerText.trim();
    setLevelResults((prev) =>
      prev.map((r, ri) => (ri === activeTab ? { ...r, title: newTitle } : r))
    );
  }

  function makePdfSections(sects: { heading: string; content: string }[]) {
    return sects
      .filter((s) => !/^name:\s*_+/i.test(s.heading))
      .map((s) => ({ ...s, isAnswerKey: /answer key/i.test(s.heading) }));
  }

  function downloadPdf() {
    if (!worksheetText) return;
    generatePdf({
      title,
      subtitle: `${level.split("—")[0].trim()}  •  ${focus}  •  ${excount}`,
      sections: makePdfSections(sections),
      studentInfoLine: true,
      filename: `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
    });
  }

  function downloadTabPdf() {
    const r = levelResults[activeTab];
    if (!r) return;
    generatePdf({
      title: r.title,
      subtitle: `${r.level.split("—")[0].trim()}  •  ${focus}  •  ${excount}`,
      sections: makePdfSections(r.sections),
      studentInfoLine: true,
      filename: `${r.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
    });
  }

  const activeResult = levelResults[activeTab];

  return (
    <>
      <Link href="/" className="back-btn">
        ← Back to tools
      </Link>
      <div className="tool-page">
        <aside className="form-panel">
          <div className="form-title">📄 Worksheet Generator</div>

          {!multiLevel ? (
            <div className="field">
              <label>Student level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)}>
                {LEVELS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          ) : (
            <div className="field">
              <label>Levels to generate <span className="field-note">(up to 3)</span></label>
              <div className="level-chip-row">
                {LEVELS.map((l, i) => {
                  const code = LEVEL_CODES[i];
                  const on = selectedLevels.includes(l);
                  const maxed = selectedLevels.length >= 3 && !on;
                  return (
                    <button
                      key={l}
                      type="button"
                      className={`level-chip${on ? " on" : ""}${maxed ? " disabled" : ""}`}
                      onClick={() => !maxed && toggleLevel(l)}
                      title={l}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="multilevel-toggle-row">
            <button
              type="button"
              className={`multilevel-toggle${multiLevel ? " active" : ""}`}
              onClick={toggleMultiLevel}
            >
              {multiLevel ? "✓ " : ""}Multi-level
            </button>
            <span className="multilevel-badge">Pro</span>
            <span className="multilevel-hint">
              {multiLevel
                ? `Generates ${selectedLevels.length} version${selectedLevels.length !== 1 ? "s" : ""} in parallel`
                : "Generate for multiple levels at once"}
            </span>
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
              <select value={answers} onChange={(e) => setAnswers(e.target.value)}>
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
            {multiLevel && selectedLevels.length > 1
              ? `Generate for ${selectedLevels.length} levels`
              : "Generate worksheet"}
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

          {/* Multi-level tabbed results */}
          {showResult && !loading && multiLevel && levelResults.length > 1 && (
            <>
              <div className="level-tabs">
                {levelResults.map((r, i) => (
                  <button
                    key={r.level}
                    className={`level-tab${i === activeTab ? " active" : ""}`}
                    onClick={() => setActiveTab(i)}
                  >
                    {r.level.split("—")[0].trim()}
                  </button>
                ))}
              </div>
              {activeResult && (
                <div className="result-card">
                  <div className="result-header">
                    <div>
                      <div
                        className="result-title"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleTabTitleEdit}
                      >
                        {activeResult.title}
                      </div>
                      <div className="pill-row">
                        <span className="pill pill-blue">{activeResult.level.split("—")[0].trim()}</span>
                        <span className="pill pill-green">{focus}</span>
                        <span className="pill pill-amber">{excount}</span>
                      </div>
                    </div>
                    <div className="result-actions">
                      <button className="btn-sm" onClick={downloadTabPdf}>Download PDF</button>
                      <button className="btn-sm" onClick={copyTabText}>Copy</button>
                    </div>
                  </div>
                  <p className="edit-hint">Click any text below to edit it.</p>
                  <div className="result-body">
                    {activeResult.sections.map((s, i) =>
                      s.content ? (
                        <div key={`section-${i}`} className="section">
                          <div className="section-label">{s.heading}</div>
                          <div
                            className="section-content"
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => handleTabSectionEdit(i, "content", e)}
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
                            onBlur={(e) => handleTabSectionEdit(i, "heading", e)}
                          >
                            {s.heading}
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Single level result */}
          {showResult && !loading && (!multiLevel || levelResults.length <= 1) && (
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
                    <span className="pill pill-blue">{level.split("—")[0].trim()}</span>
                    <span className="pill pill-green">{focus}</span>
                    <span className="pill pill-amber">{excount}</span>
                  </div>
                </div>
                <div className="result-actions">
                  <button className="btn-sm" onClick={downloadPdf}>Download PDF</button>
                  <button className="btn-sm" onClick={copyText}>Copy</button>
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
