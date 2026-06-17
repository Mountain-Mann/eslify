"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Forgot password" mini-flow, kept on the same page rather than a
  // separate route to minimize new files for now.
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // With email confirmation disabled, signUp() also returns an
      // active session, so the user is immediately logged in.
      router.push(redirect);
      router.refresh();
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setLoading(false);

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Incorrect email or password."
            : signInError.message
        );
        return;
      }

      router.push(redirect);
      router.refresh();
    }
  }

  async function handleResetRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${appUrl}/reset-password` }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
    }
  }

  if (resetMode) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Reset your password</h1>
          <p>Enter your email and we&apos;ll send you a reset link.</p>
          {resetSent ? (
            <div className="login-success">
              Check your email for a password reset link.
            </div>
          ) : (
            <form onSubmit={handleResetRequest}>
              <div className="field">
                <label htmlFor="reset-email">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                />
              </div>
              <button className="btn-main" type="submit" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
              {error && <div className="login-error">{error}</div>}
            </form>
          )}
          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setResetMode(false);
              setResetSent(false);
              setError(null);
            }}
          >
            ← Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{mode === "signin" ? "Sign in to ESLify" : "Create your account"}</h1>
        <p>
          {mode === "signin"
            ? "Sign in to access Pro features and your billing."
            : "Sign up to unlock Pro features. Free tools don't require an account."}
        </p>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              autoComplete="email"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>
          {mode === "signup" && (
            <div className="field">
              <label htmlFor="confirm-password">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
            </div>
          )}
          <button className="btn-main" type="submit" disabled={loading}>
            {loading
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
          {error && <div className="login-error">{error}</div>}
        </form>

        {mode === "signin" && (
          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setResetMode(true);
              setError(null);
            }}
          >
            Forgot your password?
          </button>
        )}

        <div className="auth-divider" />

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}