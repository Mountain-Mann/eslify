// lib/anon.ts
// Generates and persists a random anonymous identifier in localStorage
// so free-tier usage can be tracked without requiring an account.
// This is intentionally simple (not abuse-proof — a user could clear
// localStorage to reset their count) but is fine for an early-stage
// launch where the priority is removing signup friction.

const ANON_ID_KEY = "eslify_anon_id";

function generateId(): string {
  // crypto.randomUUID is available in all modern browsers; fall back
  // to a timestamp+random string just in case.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getAnonId(): string {
  if (typeof window === "undefined") return ""; // SSR guard

  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = generateId();
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}