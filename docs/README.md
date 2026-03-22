# Timo — Five Things Planner

> A personal hourly planner built as a single-page app (SPA) for planning your day in focused, manageable blocks.

---

## Table of Contents

- [User Guide](#user-guide) *(non-technical)*
  - [What is Timo?](#what-is-timo)
  - [Getting Started](#getting-started)
  - [Planning Your Day](#planning-your-day)
  - [Task Actions](#task-actions)
  - [Tags](#tags)
  - [Notes](#notes)
  - [Recurring Tasks](#recurring-tasks)
  - [Deferring & Dismissing](#deferring--dismissing)
  - [Focus Panel](#focus-panel)
  - [Settings](#settings)
- [Technical Reference](#technical-reference) *(developer)*
  - [Stack](#stack)
  - [Project Structure](#project-structure)
  - [Architecture](#architecture)
  - [Database Schema](#database-schema)
  - [Key Design Decisions](#key-design-decisions)
  - [Deployment](#deployment)
  - [Environment Variables](#environment-variables)

---

## User Guide

### What is Timo?

Timo is a personal daily planner where you assign tasks to specific hours of the day. Each hour can hold up to **five task slots**. The goal is to be intentional about how you spend each hour — not just what you want to do, but *when* you'll do it.

---

### Getting Started

When you first open Timo, a short onboarding wizard walks you through:

1. **Welcome** — Introduction to the app
2. **Sleep schedule** — Set your wake and sleep times (only hours within this range are shown in the planner)
3. **Work hours** — Set your work start/end times and which days are work days
4. **Theme** — Choose light, dark, or system-matched theme and an accent colour
5. **PIN** — Optionally set a 4-digit PIN to lock the app

After onboarding, you land on the main planner for today.

---

### Planning Your Day

The planner shows your active hours as a vertical list of **hour slots** (e.g. 7 AM, 8 AM … 10 PM). Each slot can contain up to 5 tasks.

**Adding a task:**
- Click the `+` button inside any hour slot
- Type your task — suggestions from your history appear as you type
- Press **Enter** or click away to save
- An icon is automatically inferred from the text (e.g. typing "lunch" shows a fork icon)

**Completing a task:**
- Click the circle icon on the left of a task to mark it done (turns to a filled check)

**Navigating days:**
- Use the `‹` and `›` arrows in the header to move between days
- Click "Back to today" to return to the current date

---

### Task Actions

Each task row shows action buttons on hover (left panel only — the focus panel is read-only):

| Button | Action |
|--------|--------|
| `←` | Move to nearest previous hour with a free slot |
| `→` | Overflow to next available hour slot |
| `⋯` | Open the more-actions popup |

**The ⋯ popup** opens a compact horizontal toolbar:

```
[ Work | Personal | Career | Fun ]   ← tag pills
[ 📅 | 📝 🔁 | 🗄 🗑 ]              ← icons with separators
```

| Icon | Action |
|------|--------|
| 📅 CalendarPlus | Defer to tomorrow |
| 📝 NotebookPen | Add / edit note |
| 🔁 RefreshCw | Toggle recurring |
| 🗄 Archive | Dismiss (soft-hide) |
| 🗑 Trash | Delete permanently |

---

### Tags

Each task can have **one tag**:

| Tag | Colour | Auto-detected keywords |
|-----|--------|------------------------|
| **Work** | Blue | jira, dev, sprint, refinement, 1-1, standup, deploy, office |
| **Personal** | Green | lunch, dinner, gym, yoga, exercise, doctor, family, grocery |
| **Career** | Purple | research, leetcode, udemy, course, learn, study |
| **Fun** | Orange | youtube, netflix, movie, game, swat, rookie, party |

- Tags are **inferred automatically** from the task text when you save
- You can manually override the tag via the ⋯ popup tag pills
- Clicking the same tag again **removes** it (toggle)
- Recurring tasks **copy their tag** to the next day

---

### Notes

Each task can hold a rich-text note:

- If no note exists, a **NotebookPen button** appears in the ⋯ popup
- If a note already exists, a **StickyNote indicator** is always visible on the task row
- The note editor supports: **Bold**, *Italic*, Underline, ~~Strikethrough~~, `code`, bullet lists, numbered lists
- Notes are stored as HTML and rendered inline below the task

---

### Recurring Tasks

Mark any task as **recurring** via the ⋯ → 🔁 button. Recurring tasks:

- Are automatically copied to the next day when you use **Copy Recurring** (🔄 button in header)
- Retain their hour, slot position, icon, and **tag**
- Show a recurring indicator on the task row
- If a copy already exists at that slot, only the tag is synced (not duplicated)

The original creation date and hour are recorded for reference in the flag tooltip.

---

### Deferring & Dismissing

**Defer (📅)** — Moves the task to **tomorrow** at the same hour it was originally created. If that slot is taken, it finds the next free slot.

**Dismiss (🗄)** — Soft-deletes the task. It stays in the database for audit purposes and appears **faded and italic** in the planner. Can be un-dismissed.

**Delete (🗑)** — Permanently removes the task. An **Undo** button (amber, in the header) appears immediately after deletion and lasts until you navigate away or refresh.

---

### Focus Panel

The right-hand panel (or mobile drawer via the **⊟** button in the header on small screens) shows:

**Now** — Current time and date, plus the previous, current, and next hour slots in read-only view. A progress bar shows how far through the current hour you are.

**Today** — Three stat tiles for today's tasks:
- ✅ Done `/ planned`
- ➡️ Moved `/ planned`
- 🗄 Dismissed `/ planned`
- Shows "X upcoming" count for tasks in future hours today

**This week** — Same three tiles, counting only **past tasks up to the current hour** (future days/hours are excluded from the counts).

**By tag** — Coloured pills showing task counts per tag across the **full week** (including upcoming tasks), so you can see your planned workload by category at a glance.

---

### Settings

Access via the ⚙️ icon in the header. You can change:

- Wake / sleep times
- Work hours and work days
- Theme (light / dark / system)
- Accent colour
- PIN lock

---

---

## Technical Reference

### Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS v3 (class-based dark mode) |
| State | Zustand 5 (persisted to localStorage) |
| Database | Supabase (PostgreSQL) with localStorage fallback |
| Rich text | TipTap 3 (`@tiptap/react`, `starter-kit`, `extension-underline`) |
| Icons | Lucide React |
| Routing | React Router v6 |
| Deployment | AWS EC2 + nginx |
| Node | 18+ |

---

### Project Structure

```
src/
├── App.jsx                        # Router, ThemeProvider, PinLock wrapper
├── index.css                      # Tailwind base + custom prose + accent CSS vars
│
├── components/
│   ├── onboarding/
│   │   ├── Onboarding.jsx         # 5-step wizard orchestrator
│   │   ├── StepWelcome.jsx
│   │   ├── StepSleep.jsx
│   │   ├── StepWork.jsx
│   │   ├── StepTheme.jsx
│   │   └── StepPin.jsx
│   │
│   ├── planner/
│   │   ├── PlannerView.jsx        # Main layout: header, day navigation, split view
│   │   ├── HourSlot.jsx           # One hour card with drag-to-reorder tasks
│   │   ├── TaskItem.jsx           # Individual task row — all interactions & actions
│   │   ├── FocusPanel.jsx         # Right panel: now view, today/week stats
│   │   └── NewDayModal.jsx        # "Copy recurring tasks?" modal on new day
│   │
│   └── ui/
│       ├── ThemeProvider.jsx      # Applies dark class + CSS accent var to <html>
│       ├── PinLock.jsx            # PIN entry screen
│       ├── IconPicker.jsx         # Icon picker grid
│       └── NoteEditor.jsx         # TipTap rich-text editor component
│
├── lib/
│   ├── supabase.js                # Supabase client (exports null if env vars missing)
│   ├── db.js                      # All DB operations; dual Supabase/localStorage
│   ├── schema.js                  # SQL schema + ALTER TABLE migration statements
│   ├── crypto.js                  # PIN hashing (SHA-256 with djb2 HTTP fallback)
│   ├── icons.js                   # 70+ keyword → Lucide icon name mappings
│   └── dateUtils.js               # Date helpers: toDateString, addDays, getWeekDates…
│
├── store/
│   └── useAppStore.js             # Zustand store: settings, tasksByDate, undo state
│
└── pages/
    └── SettingsPage.jsx           # /settings route
```

---

### Architecture

#### Data flow

```
User interaction
      │
      ▼
  TaskItem / HourSlot   (local state: editing, menus, confirmations)
      │
      ▼
  db.js functions       (upsertTask, deleteTask, deferTask, …)
      │
      ├──► Supabase (if VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set)
      └──► localStorage  (fallback when env vars absent or on HTTP)
      │
      ▼
  useAppStore.updateTask / addTask / removeTask
      │
      ▼
  React re-render
```

#### State management

- **Zustand store** (`useAppStore`) holds `settings`, `tasksByDate` (keyed by `YYYY-MM-DD` date string), and `lastDeletedTask` (ephemeral).
- `tasksByDate` and `settings` are persisted to `localStorage` via Zustand's `persist` middleware with a `partialize` filter that excludes `lastDeletedTask`.
- When Supabase is available, the store acts as a **UI cache** — the DB is the source of truth, loaded on every date navigation.

#### Portal-based dropdowns

The ⋯ task menu renders via `createPortal(…, document.body)` to escape `overflow-hidden` / scroll-clipped containers. Its position is calculated with `getBoundingClientRect` on the trigger button at open time, then anchored with `transform: translate(-100%, -100%)` so it always floats above-left of the button.

#### Mobile focus panel

On small screens (`< lg`), the focus panel is hidden. A `PanelRight` icon button in the header toggles a slide-in drawer that renders the same `FocusPanel` component over a blurred backdrop.

---

### Database Schema

#### `user_settings`
| Column | Type | Default |
|--------|------|---------|
| `id` | uuid PK | `gen_random_uuid()` |
| `pin_hash` | text | — |
| `wake_time` | time | `07:00` |
| `sleep_time` | time | `22:00` |
| `work_start` | time | `09:00` |
| `work_end` | time | `17:00` |
| `workdays` | int[] | `{1,2,3,4,5}` (Mon–Fri) |
| `theme` | text | `system` |
| `accent_color` | text | `#6366f1` |
| `onboarding_done` | boolean | `false` |

#### `tasks`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `settings_id` | uuid FK | Cascade delete |
| `date` | date | `YYYY-MM-DD` |
| `hour` | int 0–23 | |
| `slot_index` | int 0–4 | |
| `text` | text | |
| `icon` | text | Lucide icon name |
| `icon_manual` | boolean | User explicitly chose icon |
| `is_recurring` | boolean | |
| `completed` | boolean | |
| `overflowed_from_hour` | int | Set when moved via → |
| `note` | text | HTML string from TipTap |
| `dismissed` | boolean | Soft-delete flag |
| `original_hour` | int | Hour at first creation (for defer) |
| `original_slot_index` | int | Slot at first creation |
| `deferred_from_date` | date | Source date when deferred |
| `tag` | text | `work` / `personal` / `career` / `fun` |

#### `task_history`
Stores past task texts per hour for autocomplete suggestions. Tracks `use_count` and `last_icon` to surface the most relevant suggestions first.

> **Migration note:** If your `tasks` table was created from an older schema, run the `ALTER_SQL` export from `src/lib/schema.js` in the Supabase SQL Editor to add all missing columns.

---

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Dual Supabase / localStorage mode | Works fully offline or on plain HTTP without env vars; no error shown to user |
| `crypto.subtle` djb2 fallback | `crypto.subtle` is HTTPS-only; djb2 hash used transparently on plain HTTP |
| `crypto.randomUUID` fallback | Same HTTPS restriction; `Math.random`-based UUID used on HTTP |
| Explicit `insert` / `update` instead of Supabase `upsert` | `upsert` was creating duplicate rows; branching on presence of `id` field resolves it |
| Strip `id: null` before insert | Supabase rejects null primary keys; `id` is destructured out of the payload before insert |
| RLS disabled on all tables | Single-user personal app; no multi-tenant isolation needed |
| TipTap for notes | Full rich-text API, HTML output, and extension system without building a custom editor |
| Portal for ⋯ dropdown | Hour slots previously had `overflow-hidden`; portal escapes all scroll/clip ancestors |
| Tag inference on save | Auto-classifies tasks without user friction; always manually overridable |
| Recurring copy patches existing tag | If a task was already copied before its tag was set, the tag is backfilled on next copy run |
| FocusPanel always shows today | Right panel is pinned to today regardless of which day is open in the left planner |
| Week stats scoped to past-only | Avoids inflating "planned" counts with future tasks that haven't been acted on yet |
| Tag breakdown spans full week | Shows planned workload by category including future tasks — useful for capacity awareness |

---

### Deployment

The app is deployed as a static build served from AWS EC2 via nginx. Recovery is manual by design: the repo documents the exact steps, but it does not use Terraform/OpenTofu or AWS/Cloudflare automation.

**Build:**
```bash
npm run build
```

**Deploy to EC2:**
```bash
scp -i ~/.ssh/timo-ssh-key.pem -r dist/* ec2-user@3.125.39.71:/usr/share/nginx/html/
```

**nginx config** (`/etc/nginx/conf.d/timo.conf`):
```nginx
server {
    listen 80;
    server_name timo.sreeman.xyz;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name timo.sreeman.xyz;
    ssl_certificate /etc/ssl/cloudflare/timo.pem;
    ssl_certificate_key /etc/ssl/cloudflare/timo.key;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

> The 443 block serves static files directly; do not `proxy_pass` to `localhost:80` because it causes a redirect loop.
>
> Cloudflare SSL mode should remain **Full (Strict)**, so the origin certificate must stay valid on the instance.

**Manual EC2 recovery when the host is replaced:**

1. Launch a new Amazon Linux 2023 instance in `eu-central-1` with the `timo-ssh-key` key pair.
2. Install nginx and enable it:
   ```bash
   sudo dnf install nginx -y && sudo systemctl enable nginx
   ```
3. Create `/etc/ssl/cloudflare/` and install the Cloudflare origin certificate and key:
   ```bash
   sudo mkdir -p /etc/ssl/cloudflare/
   ```
   If the private key is lost, generate a new pair in Cloudflare because the original key is not recoverable.
   Lock down the key after copying it:
   ```bash
   sudo chmod 600 /etc/ssl/cloudflare/timo.key
   ```
   Verify the files are in place:
   ```bash
   sudo ls -l /etc/ssl/cloudflare/timo.{pem,key}
   ```
4. Write `/etc/nginx/conf.d/timo.conf` with the config above.
5. Validate and start nginx:
   ```bash
   sudo nginx -t && sudo systemctl start nginx
   sudo ss -tlnp | grep -E '80|443'
   ```
6. Make sure `/usr/share/nginx/html/` is writable by the deployment user before copying files:
   ```bash
   sudo chown -R ec2-user:ec2-user /usr/share/nginx/html/
   ```
7. Open ports 22, 80, and 443 in the security group; keep 80 and 443 restricted to the current Cloudflare IPv4 ranges from https://www.cloudflare.com/ips-v4/.
8. If the public IP changed, update the Cloudflare A record for `timo.sreeman.xyz` to the new IP.
9. Copy the production build to the instance:
   ```bash
   scp -i ~/.ssh/timo-ssh-key.pem -r dist/* ec2-user@<new-ip>:/usr/share/nginx/html/
   ```
10. Verify the site:
   ```bash
   curl -I https://timo.sreeman.xyz
   ```

---

### Environment Variables

Create a `.env` file in the project root (do not commit this file):

```env
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

If either variable is absent, the app falls back to `localStorage` for all storage. No error is thrown or shown to the user.
