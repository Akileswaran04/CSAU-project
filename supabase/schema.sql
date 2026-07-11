-- Riddle Rush — Persistent Leaderboard Schema
-- Run this in your Supabase SQL Editor to create the required tables.

-- ─── Matches ───
create table if not exists public.matches (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  winner_team_id text not null,
  winner_name   text not null,
  winner_score  integer not null default 0,
  total_teams   integer not null default 0
);

-- ─── Match Teams (per-team breakdown) ───
create table if not exists public.match_teams (
  id                uuid primary key default gen_random_uuid(),
  match_id          uuid not null references public.matches(id) on delete cascade,
  team_name         text not null,
  team_color        text not null,
  score             integer not null default 0,
  position          integer not null default 0,
  riddles_correct   integer not null default 0,
  riddles_attempted integer not null default 0,
  rank              integer not null default 0
);

-- ─── Indexes ───
create index if not exists idx_match_teams_match_id on public.match_teams(match_id);
create index if not exists idx_matches_created_at on public.matches(created_at desc);

-- ─── Row-Level Security (append-only: anyone can insert/read, no update/delete) ───
alter table public.matches enable row level security;
alter table public.match_teams enable row level security;

create policy "Anyone can insert matches"
  on public.matches for insert
  with check (true);

create policy "Anyone can read matches"
  on public.matches for select
  using (true);

create policy "Anyone can insert match teams"
  on public.match_teams for insert
  with check (true);

create policy "Anyone can read match teams"
  on public.match_teams for select
  using (true);
