-- Infant Healthcare AI Chat — initial schema
--
-- Note: Do not run CREATE EXTENSION here. Supabase enables pgcrypto by default
-- (needed for gen_random_uuid()). The SQL Editor also rejects CREATE EXTENSION
-- with: "cannot execute CREATE EXTENSION in a read-only transaction".
-- If gen_random_uuid() fails, enable "pgcrypto" under Database → Extensions.

-- Reference vaccine schedule (not user-specific)
create table local_vaccine_schedule (
  id uuid primary key default gen_random_uuid(),
  region text not null default 'US',
  vaccine_name text not null,
  due_at_weeks integer not null,
  notes text
);

-- Children
create table children (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  date_of_birth date not null,
  created_at timestamptz not null default now()
);

create index children_user_id_idx on children (user_id);

create table vaccine_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children (id) on delete cascade,
  vaccine_name text not null,
  administered_at date not null,
  notes text
);

create table allergies (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children (id) on delete cascade,
  allergen text not null,
  severity text,
  notes text
);

create table feeding_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children (id) on delete cascade,
  logged_at timestamptz not null,
  type text not null,
  amount_ml integer,
  notes text
);

create table sleep_logs (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  notes text
);

create table growth_records (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references children (id) on delete cascade,
  recorded_at date not null,
  weight_kg numeric(5, 2),
  height_cm numeric(5, 1)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  child_id uuid not null references children (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now()
);

create index conversations_user_id_idx on conversations (user_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on messages (conversation_id);

-- RLS
alter table children enable row level security;
alter table vaccine_records enable row level security;
alter table allergies enable row level security;
alter table feeding_logs enable row level security;
alter table sleep_logs enable row level security;
alter table growth_records enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table local_vaccine_schedule enable row level security;

create policy "Users manage own children"
  on children for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage vaccine records for own children"
  on vaccine_records for all
  using (
    exists (
      select 1 from children c
      where c.id = vaccine_records.child_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from children c
      where c.id = vaccine_records.child_id and c.user_id = auth.uid()
    )
  );

create policy "Users manage allergies for own children"
  on allergies for all
  using (
    exists (
      select 1 from children c
      where c.id = allergies.child_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from children c
      where c.id = allergies.child_id and c.user_id = auth.uid()
    )
  );

create policy "Users manage feeding logs for own children"
  on feeding_logs for all
  using (
    exists (
      select 1 from children c
      where c.id = feeding_logs.child_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from children c
      where c.id = feeding_logs.child_id and c.user_id = auth.uid()
    )
  );

create policy "Users manage sleep logs for own children"
  on sleep_logs for all
  using (
    exists (
      select 1 from children c
      where c.id = sleep_logs.child_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from children c
      where c.id = sleep_logs.child_id and c.user_id = auth.uid()
    )
  );

create policy "Users manage growth records for own children"
  on growth_records for all
  using (
    exists (
      select 1 from children c
      where c.id = growth_records.child_id and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from children c
      where c.id = growth_records.child_id and c.user_id = auth.uid()
    )
  );

create policy "Users manage own conversations"
  on conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage messages in own conversations"
  on messages for all
  using (
    exists (
      select 1 from conversations conv
      where conv.id = messages.conversation_id and conv.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from conversations conv
      where conv.id = messages.conversation_id and conv.user_id = auth.uid()
    )
  );

create policy "Authenticated users can read vaccine schedule"
  on local_vaccine_schedule for select
  to authenticated
  using (true);

-- Seed reference schedule
insert into local_vaccine_schedule (region, vaccine_name, due_at_weeks, notes) values
  ('US', 'Hepatitis B (1st dose)', 0, 'Birth dose'),
  ('US', 'DTaP', 8, '2 months'),
  ('US', 'Hib', 8, '2 months'),
  ('US', 'IPV', 8, '2 months'),
  ('US', 'PCV13', 8, '2 months'),
  ('US', 'Rotavirus', 8, '2 months'),
  ('US', 'DTaP (2nd dose)', 16, '4 months'),
  ('US', 'Hib (2nd dose)', 16, '4 months'),
  ('US', 'IPV (2nd dose)', 16, '4 months'),
  ('US', 'PCV13 (2nd dose)', 16, '4 months'),
  ('US', 'Rotavirus (2nd dose)', 16, '4 months'),
  ('US', 'DTaP (3rd dose)', 24, '6 months'),
  ('US', 'Hib (3rd dose)', 24, '6 months'),
  ('US', 'IPV (3rd dose)', 24, '6 months'),
  ('US', 'PCV13 (3rd dose)', 24, '6 months'),
  ('US', 'Influenza (annual)', 26, '6+ months when in season'),
  ('US', 'MMR', 52, '12 months'),
  ('US', 'Varicella', 52, '12 months'),
  ('US', 'Hepatitis A (1st dose)', 52, '12 months'),
  ('US', 'PCV13 (4th dose)', 52, '12–15 months');
