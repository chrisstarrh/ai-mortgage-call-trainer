create table profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  role text check (role in ('loan_officer','manager','admin')) default 'loan_officer',
  created_at timestamptz default now()
);

create table scenarios (
  id text primary key,
  title text not null,
  summary text,
  difficulty text,
  borrower jsonb not null,
  win_condition text,
  active boolean default true,
  created_at timestamptz default now()
);

create table training_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  scenario_id text references scenarios(id),
  status text check (status in ('started','completed','scored')) default 'started',
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table call_transcripts (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references training_calls(id) on delete cascade,
  speaker text check (speaker in ('loan_officer','borrower','system')),
  text text not null,
  created_at timestamptz default now()
);

create table scorecards (
  id uuid primary key default gen_random_uuid(),
  call_id uuid references training_calls(id) on delete cascade,
  overall_score int,
  pass_fail text,
  category_scores jsonb,
  coaching jsonb,
  created_at timestamptz default now()
);
