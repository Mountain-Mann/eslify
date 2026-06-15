import type { Profile, UserState } from "./types";

export function profileToUserState(profile: Profile): UserState {
  const isPro = profile.subscription_status === "active";
  return {
    creditsRemaining: profile.credits_remaining,
    isPro,
    email: profile.email,
    subscriptionPlan: profile.subscription_plan,
  };
}

export function isProStatus(status: string): boolean {
  return status === "active";
}
