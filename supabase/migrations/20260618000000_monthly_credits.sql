-- Switch free credits from 5 lifetime to 10/month
-- Adds credits_reset_at to track when to reset the monthly allowance

alter table public.profiles
  add column if not exists credits_reset_at timestamptz not null default now();

-- New users start with 10 credits
alter table public.profiles
  alter column credits_remaining set default 10;

-- Update handle_new_user() to grant 10 credits
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits_remaining, credits_reset_at)
  values (new.id, new.email, 10, now());
  return new;
end;
$$;

-- deduct_credit: auto-reset to 10 if 30+ days have passed since last reset
create or replace function public.deduct_credit(p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance int;
begin
  -- Reset monthly credits if the window has expired
  update public.profiles
  set credits_remaining = 10,
      credits_reset_at = now(),
      updated_at = now()
  where id = p_user_id
    and subscription_status != 'active'
    and credits_reset_at < now() - interval '30 days';

  -- Deduct one credit
  update public.profiles
  set credits_remaining = credits_remaining - 1,
      updated_at = now()
  where id = p_user_id
    and subscription_status != 'active'
    and credits_remaining > 0
  returning credits_remaining into new_balance;

  return new_balance;
end;
$$;

-- refund_credit: cap raised to 10
create or replace function public.refund_credit(p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance int;
begin
  update public.profiles
  set credits_remaining = least(credits_remaining + 1, 10),
      updated_at = now()
  where id = p_user_id
    and subscription_status != 'active'
  returning credits_remaining into new_balance;

  return new_balance;
end;
$$;

-- Migrate existing users to 10 credits and set reset timestamp
update public.profiles
set credits_remaining = 10,
    credits_reset_at = now()
where subscription_status != 'active';
