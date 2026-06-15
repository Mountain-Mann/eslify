-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  credits_remaining int not null default 5,
  stripe_customer_id text unique,
  subscription_status text not null default 'free'
    check (subscription_status in ('free', 'active', 'canceled', 'past_due')),
  subscription_plan text
    check (subscription_plan is null or subscription_plan in ('monthly', 'yearly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generations audit log
create table public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tool text not null check (tool in ('lesson', 'worksheet', 'check')),
  model text not null,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, credits_remaining)
  values (new.id, new.email, 5);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic credit deduction
create or replace function public.deduct_credit(p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance int;
begin
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

-- Refund credit on API failure
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
  set credits_remaining = least(credits_remaining + 1, 5),
      updated_at = now()
  where id = p_user_id
    and subscription_status != 'active'
  returning credits_remaining into new_balance;

  return new_balance;
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.generations enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can read own generations"
  on public.generations for select
  using (auth.uid() = user_id);

-- Indexes
create index generations_user_id_idx on public.generations(user_id);
create index profiles_stripe_customer_id_idx on public.profiles(stripe_customer_id);
