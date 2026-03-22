# 🗓 Five Things — Hourly Planner

A personal SPA for day-by-day, hour-by-hour planning with up to **5 focused tasks per hour slot**.

## Features

| Feature | Details |
|---|---|
| ⏱ Hourly planning | Hour grid from your wake time to bedtime |
| 5 slots per hour | Up to 5 tasks per 1-hour block |
| 🔁 Recurring tasks | Tap the ↺ icon; tasks carry forward each day |
| ➡ Task overflow | Move a task to the next hour with one click |
| 💡 Smart suggestions | Typeahead from your task history, weighted by use |
| 🏷 Auto icons | Keyword → Lucide icon inference as you type; manual override |
| 🎨 Themes | Light / Dark / System + 9 accent colours |
| 🔐 PIN lock | Optional 4-digit PIN (SHA-256 hashed) |
| ☁️ Cloud sync | Supabase backend; falls back to localStorage when no Supabase env vars |

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Supabase (optional — works offline without it)

Create a `.env` file:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Then run this SQL in your Supabase SQL editor:

```sql
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
```

### 3. Run
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

### 5. Back up or restore
```bash
./migrate/local_backup.sh
./migrate/remote_backup.sh
./migrate/remote_rollback.sh
```

### 6. Deploy to the current EC2 instance
```bash
npm run build
scp -i ~/.ssh/timo-ssh-key.pem -r dist/* ec2-user@3.125.39.71:/usr/share/nginx/html/
```

### 7. Manual EC2 recovery
If the instance is replaced or the public IP changes, follow the recovery runbook in `docs/README.md`.

The manual flow is:
1. Launch a new Amazon Linux 2023 instance in `eu-central-1` with the `timo-ssh-key` key pair.
2. Install nginx and enable it.
3. Recreate `/etc/ssl/cloudflare/` with `sudo` and restore the Cloudflare origin certificate pair.
4. Write `/etc/nginx/conf.d/timo.conf` with the nginx config from the docs.
5. Update the Cloudflare A record if the IP changed.
6. Sync the built `dist/` files to `/usr/share/nginx/html/` after making sure that directory is writable by the deployment user.
7. Verify with `curl -I https://timo.sreeman.xyz`.

---

## Tech Stack

- **React 18** + **Vite 5**
- **Tailwind CSS 3** (dark mode via class)
- **Lucide React** (icons)
- **Zustand** (state management, persisted to localStorage)
- **React Router DOM** (routing)
- **Supabase** (cloud DB, optional)
