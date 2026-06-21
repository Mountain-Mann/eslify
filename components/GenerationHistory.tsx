"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/components/UserProvider";

const TOOL_LABELS: Record<string, string> = {
  lesson: "Lesson Plan",
  worksheet: "Worksheet",
  check: "Quality Check",
  corrector: "Error Correction",
  vocabulary: "Vocabulary",
  exam: "Exam Prep",
  progress: "Progress Report",
};

interface Generation {
  id: string;
  tool: string;
  name: string | null;
  content: string | null;
  created_at: string;
  model: string;
}

export default function GenerationHistory() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Generation | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetch("/api/generations")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setGenerations(data.generations ?? []);
          setIsPro(data.isPro);
          setLimit(data.limit);
        }
      })
      .catch(() => setError("Failed to load history"))
      .finally(() => setLoading(false));
  }, [user, userLoading, router]);

  function startEdit(g: Generation) {
    setEditingId(g.id);
    setEditName(g.name ?? displayName(g));
    setTimeout(() => editInputRef.current?.focus(), 50);
  }

  async function saveEdit(id: string) {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    setGenerations((prev) =>
      prev.map((g) => (g.id === id ? { ...g, name: trimmed } : g))
    );
    setEditingId(null);
    await fetch(`/api/generations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
  }

  async function deleteGeneration(id: string) {
    setGenerations((prev) => prev.filter((g) => g.id !== id));
    if (selected?.id === id) setSelected(null);
    await fetch(`/api/generations/${id}`, { method: "DELETE" });
  }

  function displayName(g: Generation) {
    return g.name ?? `${TOOL_LABELS[g.tool] ?? g.tool}`;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (userLoading || loading) {
    return (
      <div className="history-page">
        <div className="history-loading">Loading history…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="history-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h1 className="history-title">Generation History</h1>
          <p className="history-subtitle">
            {isPro
              ? `${generations.length} saved generation${generations.length !== 1 ? "s" : ""}`
              : `${generations.length} / ${limit} saved (free plan)`}
          </p>
        </div>
        <Link href="/" className="btn-nav">
          ← Back to tools
        </Link>
      </div>

      {generations.length === 0 ? (
        <div className="history-empty">
          <p>No generations yet.</p>
          <Link href="/" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-block" }}>
            Try a tool
          </Link>
        </div>
      ) : (
        <div className="history-layout">
          <div className="history-list">
            {generations.map((g) => (
              <div
                key={g.id}
                className={`history-item${selected?.id === g.id ? " selected" : ""}`}
                onClick={() => setSelected(g)}
              >
                <div className="history-item-top">
                  <span className="history-tool-tag">
                    {TOOL_LABELS[g.tool] ?? g.tool}
                  </span>
                  <button
                    className="history-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteGeneration(g.id);
                    }}
                    title="Delete"
                  >
                    ×
                  </button>
                </div>

                {editingId === g.id ? (
                  <input
                    ref={editInputRef}
                    className="history-name-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => saveEdit(g.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(g.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <p
                    className="history-item-name"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEdit(g);
                    }}
                    title="Double-click to rename"
                  >
                    {displayName(g)}
                  </p>
                )}

                <p className="history-item-date">{formatDate(g.created_at)}</p>
              </div>
            ))}

            {!isPro && generations.length >= limit && (
              <div className="history-limit-notice">
                Free plan shows the last {limit} generations.{" "}
                <button
                  className="history-upgrade-link"
                  onClick={() => {
                    /* trigger upgrade modal via event or nav */
                    router.push("/?upgrade=1");
                  }}
                >
                  Upgrade to Pro
                </button>{" "}
                for unlimited history.
              </div>
            )}
          </div>

          <div className="history-preview">
            {selected ? (
              <>
                <div className="history-preview-header">
                  <div>
                    <p className="history-tool-tag" style={{ marginBottom: 4 }}>
                      {TOOL_LABELS[selected.tool] ?? selected.tool}
                    </p>
                    <h2 className="history-preview-title">{displayName(selected)}</h2>
                    <p className="history-item-date">{formatDate(selected.created_at)}</p>
                  </div>
                  <button
                    className="btn-nav"
                    onClick={() => startEdit(selected)}
                  >
                    Rename
                  </button>
                </div>
                <pre className="history-content">
                  {selected.content ?? "No content saved for this generation."}
                </pre>
              </>
            ) : (
              <div className="history-preview-empty">
                Select a generation to view its content
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
