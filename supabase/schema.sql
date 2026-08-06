-- Ironset schema. Postgres / Supabase.
-- Run order: schema.sql  ->  seed.sql (generated)
-- Everything is metric internally (cm, kg). Convert at the UI edge.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type sex as enum ('male', 'female');
create type metabolic_rate as enum ('slow', 'slightly_slow', 'normal', 'slightly_fast', 'fast');
create type lifting_tenure as enum ('just_starting', 'under_6mo', '6mo_2yr', '2yr_plus');
create type set_action as enum ('increase', 'decrease', 'hold');
create type goal as enum ('bulk', 'cut', 'maintain');
create type progression_mode as enum ('weight', 'reps');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table profiles (
  id                    uuid primary key references auth.users on delete cascade,
  height_cm             numeric(5,1),
  weight_kg             numeric(5,1),
  age                   int check (age between 13 and 100),
  sex                   sex,
  body_fat_pct          numeric(4,1) check (body_fat_pct between 3 and 60),
  perceived_metabolism  metabolic_rate not null default 'normal',
  tenure                lifting_tenure,
  training_days         int check (training_days between 2 and 6),
  split_key             text,
  custom_split          jsonb,
  goal                  goal not null default 'maintain',
  onboarded             boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger trg_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Reference catalog
-- ---------------------------------------------------------------------------
create table patterns (
  slug      text primary key,
  muscle    text not null,
  name      text not null,
  prompt    text not null default 'Select one you enjoy',
  optional  boolean not null default false
);

create table exercises (
  id                uuid primary key default gen_random_uuid(),
  pattern_slug      text not null references patterns(slug) on delete cascade,
  name              text not null,
  compound          boolean not null,
  tags              text[] not null default '{}',
  increment_kg      numeric(4,2) not null default 2.5,
  progression_mode  progression_mode not null default 'weight',
  retired           boolean not null default false,
  unique (pattern_slug, name)
);
create index on exercises (pattern_slug);
create index on exercises (retired);

-- ---------------------------------------------------------------------------
-- Per-user chosen exercise for each pattern
-- ---------------------------------------------------------------------------
-- Primary key includes exercise_id (not just user_id + pattern_slug) so a
-- user can select MULTIPLE exercises for patterns that support it — right
-- now that's just upper-back-combo, where coverage across traps/rear-delt/
-- mid-back can require more than one exercise. Every other pattern's UI
-- still only lets the user pick one, so this is additive, not a behavior
-- change for the rest of the app.
create table user_exercise_choices (
  user_id       uuid not null references auth.users on delete cascade,
  pattern_slug  text not null references patterns(slug) on delete cascade,
  exercise_id   uuid not null references exercises(id) on delete cascade,
  updated_at    timestamptz not null default now(),
  primary key (user_id, pattern_slug, exercise_id)
);
create trigger trg_choices_updated before update on user_exercise_choices
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Per-user working state for each exercise
-- ---------------------------------------------------------------------------
create table user_exercise_state (
  user_id          uuid not null references auth.users on delete cascade,
  exercise_id      uuid not null references exercises(id) on delete cascade,
  working_weight_kg numeric(6,2) not null default 0,
  sets             int not null default 3 check (sets between 2 and 3),
  updated_at       timestamptz not null default now(),
  primary key (user_id, exercise_id)
);
create trigger trg_state_updated before update on user_exercise_state
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Logged workouts and sets
-- ---------------------------------------------------------------------------
create table workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  session_date date not null default current_date,
  day_label    text,
  created_at   timestamptz not null default now()
);
create index on workouts (user_id, session_date desc);

create table workout_sets (
  id          uuid primary key default gen_random_uuid(),
  workout_id  uuid not null references workouts(id) on delete cascade,
  exercise_id uuid not null references exercises(id) on delete restrict,
  set_number  int not null check (set_number between 1 and 3),
  weight_kg   numeric(6,2) not null,
  reps        int not null check (reps between 0 and 50),
  created_at  timestamptz not null default now(),
  unique (workout_id, exercise_id, set_number)
);
create index on workout_sets (exercise_id);

-- ---------------------------------------------------------------------------
-- Daily activity logs
-- ---------------------------------------------------------------------------
create table activity_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  log_date       date not null default current_date,
  activity_type  text not null,
  duration_min   int not null check (duration_min between 1 and 600),
  rpe            int not null check (rpe between 1 and 10),
  calories       numeric(6,1) not null default 0,
  created_at     timestamptz not null default now()
);
create index on activity_logs (user_id, log_date);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles              enable row level security;
alter table user_exercise_choices enable row level security;
alter table user_exercise_state   enable row level security;
alter table workouts              enable row level security;
alter table workout_sets          enable row level security;
alter table activity_logs         enable row level security;
alter table patterns              enable row level security;
alter table exercises             enable row level security;

create policy "read patterns"  on patterns  for select to authenticated using (true);
create policy "read exercises" on exercises for select to authenticated using (true);

create policy "own profile"  on profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "own choices"  on user_exercise_choices
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own state"    on user_exercise_state
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own workouts" on workouts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own sets" on workout_sets
  for all to authenticated
  using (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()))
  with check (exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid()));

create policy "own activity" on activity_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Food logging (macro/calorie intake tracking)
-- ---------------------------------------------------------------------------
create table food_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  log_date      date not null default current_date,
  food_name     text not null,
  serving_desc  text not null,       -- e.g. "1 medium breast (172g)"
  calories      numeric(6,1) not null,
  protein_g     numeric(6,1) not null default 0,
  carbs_g       numeric(6,1) not null default 0,
  fat_g         numeric(6,1) not null default 0,
  created_at    timestamptz not null default now()
);
create index on food_logs (user_id, log_date);

alter table food_logs enable row level security;
create policy "own food logs" on food_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.food_logs to authenticated;

-- Goal weight + timeframe, used to compute a rate-based calorie offset
-- instead of the flat percentage model.
alter table profiles add column if not exists goal_weight_kg numeric(5,1);
alter table profiles add column if not exists goal_timeframe_weeks int check (goal_timeframe_weeks between 1 and 104);

-- ---------------------------------------------------------------------------
-- Daily weigh-ins, used to compute a 7-day rolling average that feeds into
-- the calorie calculation (replacing the static onboarding weight once
-- enough real data exists).
-- ---------------------------------------------------------------------------
create table weigh_ins (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  log_date    date not null default current_date,
  weight_kg   numeric(5,1) not null,
  created_at  timestamptz not null default now(),
  unique (user_id, log_date)
);
create index on weigh_ins (user_id, log_date desc);

alter table weigh_ins enable row level security;
create policy "own weigh ins" on weigh_ins
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.weigh_ins to authenticated;
