"use client";

import { useState } from "react";
import { useUpgrade } from "./UpgradeProvider";

export default function UpgradeModal() {
  const { open, closeUpgrade } = useUpgrade();
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: "monthly" | "yearly") {
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setLoading(null);
    }
  }

  if (!open) return null;

  return (
    <div
      className="overlay open"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeUpgrade();
      }}
    >
      <div className="modal">
        <div className="modal-emoji">⚡</div>
        <h2>Upgrade to ESLify Pro</h2>
        <p>
          You&apos;ve used your free credits. Upgrade for unlimited lesson plans,
          worksheets, and every tool we add.
        </p>
        <div className="plans">
          <div className="plan">
            <div className="plan-name">Free</div>
            <div className="plan-price">$0</div>
            <div className="plan-feats">
              5 lifetime credits
              <br />
              Lesson planner
              <br />
              Worksheet generator
              <br />
              Print &amp; copy
            </div>
          </div>
          <div className="plan featured">
            <div className="plan-name">Pro</div>
            <div className="plan-price">
              $15 <span>/mo</span>
            </div>
            <div className="plan-note">or $99/year — save $81</div>
            <div className="plan-feats">
              Unlimited generations
              <br />
              All tools included
              <br />
              Better AI model
              <br />
              Priority support
              <br />
              Early access to new tools
            </div>
          </div>
        </div>
        <button
          className="btn-upgrade-big"
          disabled={loading !== null}
          onClick={() => startCheckout("monthly")}
        >
          {loading === "monthly" ? "Redirecting…" : "Subscribe monthly — $15/mo"}
        </button>
        <button
          className="btn-upgrade-big"
          disabled={loading !== null}
          onClick={() => startCheckout("yearly")}
        >
          {loading === "yearly" ? "Redirecting…" : "Subscribe yearly — $99/yr"}
        </button>
        {error && (
          <p style={{ color: "var(--red)", fontSize: 13, marginBottom: 10 }}>
            {error}
          </p>
        )}
        <button className="modal-close" onClick={closeUpgrade}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
