// SQL to run in Supabase dashboard:
//
// -- user_settings (one row per anonymous session)
// create table if not exists user_settings (
//   id uuid primary key default gen_random_uuid(),
//   pin_hash text,
//   wake_time time default '07:00',
//   sleep_time time default '22:00',
//   work_start time default '09:00',
//   work_end time default '17:00',
//   workdays int[] default '{1,2,3,4,5}',
//   theme text default 'system',
//   accent_color text default '#6366f1',
//   onboarding_done boolean default false,
//   created_at timestamptz default now()
// );
//
// -- tasks (base table + all added columns)
// create table if not exists tasks ( ... );
// -- Run the ALTER TABLE block below to add missing columns to an existing table.
//
// -- task_history
// create table if not exists task_history ( ... );

export const SCHEMA_SQL = `
create table if not exists user_settings (
  id uuid primary key default gen_random_uuid(),
  pin_hash text,
  wake_time time default '07:00',
  sleep_time time default '22:00',
  work_start time default '09:00',
  work_end time default '17:00',
  workdays int[] default '{1,2,3,4,5}',
  theme text default 'system',
  accent_color text default '#6366f1',
  onboarding_done boolean default false,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  settings_id uuid references user_settings(id) on delete cascade,
  date date not null,
  hour int not null check (hour >= 0 and hour <= 23),
  slot_index int not null check (slot_index >= 0 and slot_index <= 4),
  text text not null default '',
  icon text,
  icon_manual boolean default false,
  is_recurring boolean default false,
  completed boolean default false,
  overflowed_from_hour int,
  note text,
  dismissed boolean default false,
  original_hour int,
  original_slot_index int,
  deferred_from_date date,
  tag text,
  created_at timestamptz default now()
);
create index if not exists tasks_lookup on tasks(settings_id, date, hour);

create table if not exists task_history (
  id uuid primary key default gen_random_uuid(),
  settings_id uuid references user_settings(id) on delete cascade,
  text text not null,
  hour int not null,
  use_count int default 1,
  last_icon text,
  updated_at timestamptz default now(),
  unique(settings_id, text, hour)
);
`

/** Run this in Supabase SQL editor if the tasks table already exists */
export const ALTER_SQL = `
alter table tasks add column if not exists completed boolean default false;
alter table tasks add column if not exists overflowed_from_hour int;
alter table tasks add column if not exists note text;
alter table tasks add column if not exists dismissed boolean default false;
alter table tasks add column if not exists original_hour int;
alter table tasks add column if not exists original_slot_index int;
alter table tasks add column if not exists deferred_from_date date;
alter table tasks add column if not exists tag text;
`
