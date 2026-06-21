import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProStatus } from "@/lib/user";
import type { Profile } from "@/lib/types";

const FREE_LIMIT = 10;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", user.id)
    .single();

  const isPro = isProStatus((profile as Profile | null)?.subscription_status ?? "free");
  const limit = isPro ? 500 : FREE_LIMIT;

  const { data, error } = await supabase
    .from("generations")
    .select("id, tool, name, content, created_at, model")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }

  return NextResponse.json({ generations: data, isPro, limit });
}
