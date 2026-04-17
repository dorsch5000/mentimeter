-- Sessions: jedes Event bekommt eine eigene Session
create table sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  is_active boolean default true
);

-- Votes: Stimmung + optionales Feedback
create table votes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  feedback text,
  created_at timestamptz default now()
);

-- Index für schnelle Session-Abfragen
create index idx_votes_session_id on votes(session_id);

-- Realtime aktivieren
alter publication supabase_realtime add table votes;

-- Row Level Security: Jeder darf Votes erstellen und lesen (anonymes Tool)
alter table votes enable row level security;
alter table sessions enable row level security;

create policy "Anyone can insert votes"
  on votes for insert
  with check (true);

create policy "Anyone can read votes"
  on votes for select
  using (true);

create policy "Anyone can read sessions"
  on sessions for select
  using (true);

create policy "Anyone can create sessions"
  on sessions for insert
  with check (true);
