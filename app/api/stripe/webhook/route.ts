import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const service = createServiceClient();

  async function updateProfileByCustomerId(
    customerId: string,
    updates: Record<string, unknown>
  ) {
    await service
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("stripe_customer_id", customerId);
  }

  async function updateProfileByUserId(
    userId: string,
    updates: Record<string, unknown>
  ) {
    await service
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      const plan = session.metadata?.plan as "monthly" | "yearly" | undefined;
      const customerId =
        typeof session.customer === "string" ? session.customer : null;

      if (userId) {
        await updateProfileByUserId(userId, {
          subscription_status: "active",
          subscription_plan: plan || null,
          stripe_customer_id: customerId,
        });
      } else if (customerId) {
        await updateProfileByCustomerId(customerId, {
          subscription_status: "active",
          subscription_plan: plan || null,
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      const plan = subscription.metadata?.plan as
        | "monthly"
        | "yearly"
        | undefined;

      const statusMap: Record<string, string> = {
        active: "active",
        past_due: "past_due",
        canceled: "canceled",
        unpaid: "past_due",
        incomplete: "free",
        incomplete_expired: "canceled",
        trialing: "active",
        paused: "canceled",
      };

      const subscriptionStatus =
        statusMap[subscription.status] || "free";

      await updateProfileByCustomerId(customerId, {
        subscription_status: subscriptionStatus,
        subscription_plan:
          subscriptionStatus === "active" ? plan || null : null,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      await updateProfileByCustomerId(customerId, {
        subscription_status: "canceled",
        subscription_plan: null,
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
