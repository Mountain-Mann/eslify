"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUpgrade } from "./UpgradeProvider";
import { useUser } from "./UserProvider";
import Image from "next/image";

export default function Nav() {
  const { user, loading } = useUser();
  const { showUpgrade } = useUpgrade();
  const router = useRouter();

  async function handleManageBilling() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      }
    } catch {
      // ignore
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function creditsClass(credits: number) {
    if (credits === 0) return "credits-pill empty";
    if (credits <= 1) return "credits-pill low";
    return "credits-pill";
  }

  return (
    <nav>
      <Link href="/" className="logo">
        <Image src="/logo.png" alt="ESLify" width={140} height={32} priority />
        <span className="logo-badge">BETA</span>
      </Link>
      <div className="nav-right">
        {!loading && user && !user.isPro && (
          <div className={creditsClass(user.creditsRemaining)}>
            {user.creditsRemaining}{" "}
            {user.creditsRemaining === 1 ? "credit left" : "credits left"}
          </div>
        )}
        {!loading && user?.isPro && (
          <>
            <div className="pro-badge">Pro</div>
            <button className="btn-nav" onClick={handleManageBilling}>
              Billing
            </button>
          </>
        )}
        <Link href="/" className="btn-nav">
          Tools
        </Link>
        {!loading && !user && (
          <Link href="/login" className="btn-nav">
            Sign in
          </Link>
        )}
        {!loading && user && !user.isPro && (
          <button className="btn-nav btn-pro" onClick={showUpgrade}>
            Upgrade →
          </button>
        )}
        {!loading && user && (
          <button className="btn-nav" onClick={handleSignOut}>
            Sign out
          </button>
        )}
      </div>
    </nav>
  );
}
