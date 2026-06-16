import { NextResponse } from "next/server";
import { FREE_MODEL, PRO_MODEL } from "@/lib/constants";
import { callOpenRouter } from "@/lib/openrouter";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isProStatus } from "@/lib/user";
import type { Profile, ToolType } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { tool?: ToolType; prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { tool, prompt } = body;

  if (!tool || !prompt) {
    return NextResponse.json(
      { error: "tool and prompt are required" },
      { status: 400 }
    );
  }

  if (!["lesson", "worksheet", "check"].includes(tool)) {
    return NextResponse.json({ error: "Invalid tool" }, { status: 400 });
  }

  const service = createServiceClient();
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
  }

  const model = isPro ? PRO_MODEL : FREE_MODEL;

  try {
    const content = await callOpenRouter({ prompt, isPro });

    await service.from("generations").insert({
      user_id: user.id,
      tool,
      model,
    });

    return NextResponse.json({
      content,
      creditsRemaining: isPro ? creditsRemaining : creditsRemaining,
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

    const message =
      err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}