import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawRedirect = searchParams.get("redirect") || "/";

  // Only allow internal, relative paths as a redirect target. This
  // prevents an open-redirect vulnerability where someone could craft
  // a magic link pointing ?redirect= at an external site, and also
  // guards against unexpected encoding artifacts producing something
  // that isn't a clean path.
  const redirect = rawRedirect.startsWith("/") ? rawRedirect : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}