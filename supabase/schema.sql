-- Riddle Rush — Multiplayer Schema
-- Run this in your Supabase SQL Editor to create the required tables.
-- Uses the FREE Supabase plan — Realtime is enabled by default.

-- ─── Rooms ───
create table if not exists public.rooms (
  code            text primary key,
  host_player_id  text not null,
  status          text not null default 'waiting'
                    check (status in ('waiting','playing','ended')),
  game_state      jsonb default null,
  created_at      timestamptz not null default now()
);

-- ─── Room Players ───
create table if not exists public.room_players (
  id          uuid primary key default gen_random_uuid(),
  room_code   text not null references public.rooms(code) on delete cascade,
  player_name text not null,
  is_host     boolean not null default false,
  player_id   text not null,  -- anonymous auth user id
  joined_at   timestamptz not null default now()
);

-- ─── Indexes ───
create index if not exists idx_room_players_room on public.room_players(room_code);
create index if not exists idx_rooms_status on public.rooms(status);
create index if not exists idx_rooms_created_at on public.rooms(created_at desc);

-- ─── Row-Level Security (append/read-only: anyone can insert/read, no update/delete) ───
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;

create policy "Anyone can insert rooms"
  on public.rooms for insert
  with check (true);

create policy "Anyone can read rooms"
  on public.rooms for select
  using (true);

create policy "Anyone can update rooms"
  on public.rooms for update
  using (true);

create policy "Anyone can delete rooms"
  on public.rooms for delete
  using (true);

create policy "Anyone can insert room players"
  on public.room_players for insert
  with check (true);

create policy "Anyone can read room players"
  on public.room_players for select
  using (true);

create policy "Anyone can delete room players"
  on public.room_players for delete
  using (true);

-- ─── Enable Realtime for these tables ───
-- Note: You may need to enable Realtime publication in Supabase Dashboard:
-- Go to Database → Replication → Add the 'rooms' and 'room_players' tables
-- to the 'supabase_realtime' publication.
-- Or run: alter publication supabase_realtime add table rooms, room_players;
