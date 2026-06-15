import { NextResponse } from "next/server";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Profile | null;
  if (!typedProfile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 404 }
    );
  }

  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: typedProfile.stripe_customer_id,
    return_url: getAppUrl(),
  });

  return NextResponse.json({ url: session.url });
}
