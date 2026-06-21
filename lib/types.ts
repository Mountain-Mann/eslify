export type ToolType = "lesson" | "worksheet" | "check" | "corrector" | "vocabulary" | "exam" | "progress" | "syllabus";

export type SubscriptionStatus = "free" | "active" | "canceled" | "past_due";

export type SubscriptionPlan = "monthly" | "yearly" | null;

export interface Profile {
  id: string;
  email: string | null;
  credits_remaining: number;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  created_at: string;
}

export interface VocabularyOptions {
  level: string;
  topic: string;
  wordCount: string;
  focusType: string;
  includes: string[];
}

export interface UserState {
  creditsRemaining: number;
  isPro: boolean;
  email: string | null;
  subscriptionPlan: SubscriptionPlan;
}
