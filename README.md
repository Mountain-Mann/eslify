# ESLify

AI tools web app for ESL teachers. Built with Next.js, Supabase, Stripe, and OpenRouter.

## Features

- **Lesson Planner** — CEFR-aligned lesson plans with warm-up through wrap-up
- **Worksheet Generator** — Printable student worksheets with exercises and answer keys
- **Quality Checker** (Pro) — AI feedback on lesson plan quality
- **Free tier** — 5 lifetime credits with magic-link sign-up
- **Pro tier** — Unlimited generations at $15/month or $99/year

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router) on Vercel
- [Supabase](https://supabase.com/) for auth and Postgres
- [Stripe](https://stripe.com/) for subscriptions
- [OpenRouter](https://openrouter.ai/) for AI generation

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Run the Supabase migration (`supabase/migrations/20250615000000_initial_schema.sql`)

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub and import the repo in [Vercel](https://vercel.com)
2. Add all environment variables from `.env.example`
3. Configure Supabase redirect URLs with your Vercel domain
4. Point Stripe webhook to `https://your-domain.vercel.app/api/stripe/webhook`
5. Rotate your OpenRouter API key if it was previously exposed

## Security

- OpenRouter and Stripe keys are server-side only
- Credit deduction is atomic in Postgres
- Subscription status is updated via Stripe webhooks only
- RLS enabled on all Supabase tables
