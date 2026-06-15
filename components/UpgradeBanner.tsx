"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useUser } from "@/components/UserProvider";

function UpgradeBanner() {
  const searchParams = useSearchParams();
  const { refreshUser } = useUser();
  const upgraded = searchParams.get("upgraded") === "true";

  useEffect(() => {
    if (upgraded) {
      refreshUser();
    }
  }, [upgraded, refreshUser]);

  if (!upgraded) return null;

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "1rem auto 0",
        padding: "0 1.5rem",
      }}
    >
      <div className="login-success">
        Welcome to ESLify Pro! You now have unlimited generations and access to
        the quality checker.
      </div>
    </div>
  );
}

export default function UpgradeBannerWrapper() {
  return (
    <Suspense>
      <UpgradeBanner />
    </Suspense>
  );
}
