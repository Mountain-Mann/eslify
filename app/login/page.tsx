"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

    // IMPORTANT: do NOT encodeURIComponent the redirect value here.
    // Supabase encodes the entire emailRedirectTo URL itself when it
    // builds the verification link, so manually encoding the redirect
    // param on top of that double-encodes it (e.g. "/" becomes "%252F"
    // instead of "%2F"), which breaks the callback route's ability to
    // read it correctly after the magic link is clicked.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback?redirect=${redirect}`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Sign in to ESLify</h1>
        <p>
          Enter your email and we&apos;ll send you a magic link. New accounts
          get 5 free credits.
        </p>
        {sent ? (
          <div className="login-success">
            Check your email for a sign-in link. It may take a minute to arrive.
          </div>
        ) : (
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
              />
            </div>
            <button className="btn-main" type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send magic link"}
            </button>
            {error && <div className="login-error">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}