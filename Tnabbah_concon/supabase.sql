create table if not exists public.tnabbah_rush_scores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  score int not null default 0,
  saved int not null default 0,
  health int not null default 0,
  combo int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.tnabbah_rush_scores enable row level security;

drop policy if exists "public read scores" on public.tnabbah_rush_scores;
create policy "public read scores"
on public.tnabbah_rush_scores for select
using (true);

drop policy if exists "public insert scores" on public.tnabbah_rush_scores;
create policy "public insert scores"
on public.tnabbah_rush_scores for insert
with check (char_length(name) between 1 and 16 and score >= 0);
