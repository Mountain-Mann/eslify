import { NextResponse } from "next/server";
import { FREE_MODEL, PRO_MODEL } from "@/lib/constants";
import { callOpenRouter } from "@/lib/openrouter";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isProStatus } from "@/lib/user";
import type { Profile, ToolType } from "@/lib/types";

// Pro users get a generous daily cap instead of true-unlimited. This
// protects API margin from abuse while staying well above what any
// real teacher would ever hit in a single day.
const PRO_DAILY_LIMIT = 30;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let body: { tool?: ToolType; prompt?: string; anonId?: string; title?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { tool, prompt, anonId, title } = body;

  if (!tool || !prompt) {
    return NextResponse.json(
      { error: "tool and prompt are required" },
      { status: 400 }
    );
  }

  if (!["lesson", "worksheet", "check", "corrector", "vocabulary", "exam", "progress", "syllabus"].includes(tool)) {
    return NextResponse.json({ error: "Invalid tool" }, { status: 400 });
  }

  const service = createServiceClient();

  // ── ANONYMOUS PATH (no logged-in user) ──────────────────────────
  // Free tools only — the quality checker and Pro features always
  // require a real account, since they're tied to billing identity.
  if (!user) {
    if (tool === "check") {
      return NextResponse.json(
        { error: "Sign in required for the quality checker", code: "LOGIN_REQUIRED" },
        { status: 401 }
      );
    }

    if (!anonId || typeof anonId !== "string" || anonId.length < 8) {
      return NextResponse.json(
        { error: "Missing anonymous ID" },
        { status: 400 }
      );
    }

    const { data: newBalance, error: deductError } = await service.rpc(
      "deduct_anon_credit",
      { p_anon_id: anonId }
    );

    if (deductError || newBalance === null) {
      return NextResponse.json(
        {
          error: "You've used your 10 free generations this month. Create a free account to keep going, or upgrade to Pro for unlimited access.",
          code: "NO_CREDITS",
        },
        { status: 402 }
      );
    }

    try {
      const content = await callOpenRouter({ prompt, isPro: false });

      await service.from("generations").insert({
        user_id: null,
        anon_id: anonId,
        tool,
        model: FREE_MODEL,
        content,
        name: title ?? null,
      });

      return NextResponse.json({
        content,
        creditsRemaining: newBalance as number,
        isPro: false,
      });
    } catch (err) {
      await service.rpc("refund_anon_credit", { p_anon_id: anonId });
      const message = err instanceof Error ? err.message : "Generation failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // ── LOGGED-IN PATH (existing behavior, unchanged) ───────────────
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const typedProfile = profile as Profile;
  const isPro = isProStatus(typedProfile.subscription_status);

  if (tool === "check" && !isPro) {
    return NextResponse.json(
      { error: "Quality checker is a Pro feature", code: "PRO_REQUIRED" },
      { status: 403 }
    );
  }

  if (!isPro && typedProfile.credits_remaining <= 0) {
    return NextResponse.json(
      { error: "No credits remaining", code: "NO_CREDITS" },
      { status: 402 }
    );
  }

  let creditsRemaining = typedProfile.credits_remaining;
  let deducted = false;
  let proUsageDeducted = false;

  if (!isPro) {
    const { data: newBalance, error: deductError } = await service.rpc(
      "deduct_credit",
      { p_user_id: user.id }
    );

    if (deductError || newBalance === null) {
      return NextResponse.json(
        { error: "No credits remaining", code: "NO_CREDITS" },
        { status: 402 }
      );
    }

    creditsRemaining = newBalance as number;
    deducted = true;
  } else {
    const { data: newProCount, error: proLimitError } = await service.rpc(
      "check_and_increment_pro_usage",
      { p_user_id: user.id, p_daily_limit: PRO_DAILY_LIMIT }
    );

    if (proLimitError) {
      return NextResponse.json(
        { error: "Usage check failed, please try again" },
        { status: 500 }
      );
    }

    if (newProCount === null) {
      return NextResponse.json(
        {
          error: `You've reached today's limit of ${PRO_DAILY_LIMIT} generations. This resets at midnight — for higher volume, contact us about our School plan.`,
          code: "DAILY_LIMIT_REACHED",
        },
        { status: 429 }
      );
    }

    proUsageDeducted = true;
  }

  const model = isPro ? PRO_MODEL : FREE_MODEL;

  try {
    const content = await callOpenRouter({ prompt, isPro });

    await service.from("generations").insert({
      user_id: user.id,
      tool,
      model,
      content,
      name: title ?? null,
    });

    return NextResponse.json({
      content,
      creditsRemaining,
      isPro,
    });
  } catch (err) {
    if (deducted) {
      const { data: refunded } = await service.rpc("refund_credit", {
        p_user_id: user.id,
      });

      if (typeof refunded === "number") {
        creditsRemaining = refunded;
      }
    }

    if (proUsageDeducted) {
      await service.rpc("refund_pro_usage", { p_user_id: user.id });
    }

    const message =
      err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}