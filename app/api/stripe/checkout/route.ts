import { NextResponse } from "next/server";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { plan?: "monthly" | "yearly" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { plan } = body;
  if (plan !== "monthly" && plan !== "yearly") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId =
    plan === "monthly"
      ? process.env.STRIPE_PRICE_MONTHLY
      : process.env.STRIPE_PRICE_YEARLY;

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price not configured" },
      { status: 500 }
    );
  }

  const service = createServiceClient();
  const { data: profile } = await service
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const typedProfile = profile as Profile | null;
  const stripe = getStripe();
  const appUrl = getAppUrl();

  let customerId = typedProfile?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await service
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/?upgraded=true`,
    cancel_url: `${appUrl}/?canceled=true`,
    metadata: {
      supabase_user_id: user.id,
      plan,
    },
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
