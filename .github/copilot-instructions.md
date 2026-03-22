# Copilot Instructions

## Build, lint, and test commands

- Install dependencies with `npm install`.
- Start the dev server with `npm run dev`.
- Create a production build with `npm run build`.
  - Baseline: this currently succeeds, but Vite warns that the main JS chunk is larger than 500 kB.
- Run the repository linter with `npm run lint`.
  - Baseline: this currently fails on pre-existing `react/prop-types`, `no-unused-vars`, `react/no-unescaped-entities`, and `react-hooks/exhaustive-deps` findings across the onboarding and planner components.
- Run the local Playwright drag/drop validation with `npm run test:e2e`.
  - This suite is intended to be a stricter pre-deploy check for planner drag/drop behavior.
  - It runs against a local-storage-only preview server so seeded browser tests do not depend on Supabase data.
  - Run a single test: `npx playwright test --grep "test name"` or `npx playwright test playwright/tests/planner-drag-and-drop.spec.js`.
  - Run headed (visible browser): `npm run test:e2e:headed`.

## Session workflow

- At the beginning of every session, surface the operational commands that matter for this repo before doing other work:
  - Run locally: `npm run dev`
  - Build for deployment: `npm run build`
  - Deploy current build to EC2: `scp -i ~/.ssh/timo-ssh-key.pem -r dist/* ec2-user@3.125.39.71:/usr/share/nginx/html/`
  - Roll back a deployed build: `./migrate/remote_rollback.sh`
  - Recover a replaced EC2 host: follow the manual runbook in `README.md` / `docs/README.md`
  - Push code changes to the remote Git repository: use the standard Git push command for the active branch, for example `git push origin <branch>`, after confirming the correct remote and branch in the current checkout
- Before ending a session, leave a short handoff in the response that captures any new instructions, code changes, and developer requests introduced during that session so the next session can pick them up quickly.

## High-level architecture

- This is a React 18 + Vite SPA for hourly day planning. The app boot flow lives in `src/App.jsx`: it loads settings first, then gates the UI in this order: onboarding, PIN lock, then the routed app. Providers wrap in order: `BrowserRouter` → `ThemeProvider` → `AppRoutes`.
- Routing is intentionally small and centralized in `src/App.jsx`: `/` renders `src/components/planner/PlannerView.jsx`, and `/settings` renders `src/pages/SettingsPage.jsx`.
- `src/store/useAppStore.js` is the central client state. It persists most state with Zustand's `persist` middleware under the `five-things-store` key, but `isUnlocked` and the delete-undo buffer (`lastDeletedTask`) stay in memory only. The store holds `tasksByDate` (keyed by `YYYY-MM-DD`), `settings`, `history`, and `lastVisitDate`.
- **Data flow**: Components call `src/lib/db.js` for persistence, then update Zustand. Components read from the store, never directly from the DB. This keeps the planner responsive with optimistic updates.
- `src/lib/db.js` is the only persistence boundary. Keep feature code talking to this module instead of reaching straight into `localStorage` or Supabase. It uses Supabase when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present, and falls back to local storage otherwise.
- The local fallback storage keys are `ft_settings`, `ft_tasks`, and `ft_history`. Future persistence changes should keep Supabase and local-storage behavior aligned.
- `src/lib/schema.js` is the authoritative schema reference for Supabase, including `ALTER_SQL` for upgrading an existing `tasks` table. The SQL block in `README.md` is older and does not include newer task columns such as `completed`, `note`, `dismissed`, `original_hour`, `original_slot_index`, `deferred_from_date`, and `tag`.
- `src/components/planner/PlannerView.jsx` orchestrates the main planner screen: it loads tasks for the selected date, eagerly loads today's tasks for the focus panel, loads weekly tasks for stats, handles new-day detection with `lastVisitDate`, and shows `NewDayModal` when recurring tasks may need copying forward.
- The planner UI is split by responsibility:
  - `HourSlot.jsx` renders one hour block, enforces the five-slot model, and handles drag reordering within the hour.
  - `TaskItem.jsx` is the largest component (~676 lines). It owns inline text editing, icon inference/manual override, recurrence, overflow/defer actions, note editing, tagging, suggestions, dismiss/delete state, and the status flags used by stats.
  - `FocusPanel.jsx` is a read-only summary view that always shows **today** (not the date selected in the left planner). Stats are scoped to past hours only.
- Settings are shared between onboarding and the main settings screen. `src/components/onboarding/Onboarding.jsx` and `src/pages/SettingsPage.jsx` both update the same settings object and persist it through `saveSettings`.
- Theme handling is centralized in `src/components/ui/ThemeProvider.jsx`. It applies the `dark` class to `document.documentElement` and sets the `--accent` CSS variable used throughout the UI. Dark mode is class-based (`darkMode: 'class'` in Tailwind config), not media-query.
- Notes are rich-text HTML stored directly on each task. `src/components/ui/NoteEditor.jsx` uses TipTap and returns HTML through `onChange`.
- `src/lib/icons.js` maps ~100+ keywords to Lucide icons via `inferIcon(text)`. `src/lib/icons.js` also exports `getIconComponent(name)` for manual icon lookups.

### Drag-and-drop system

Drag-and-drop uses **custom pointer events**, not an external library. The system works through custom DOM events:

- `timo-task-drag-start`, `timo-task-drag-move`, `timo-task-drag-commit`, `timo-task-drag-end` (defined in `HourSlot.jsx`).
- **TaskItem** initiates the drag via `pointerdown` → emits `timo-task-drag-start`, then tracks `pointermove`/`pointerup` to emit move and commit events.
- **HourSlot** listens for these events, uses `getDropTargetAtPoint(x, y)` to find the landing slot, and highlights via `data-drop-active`/`data-landing-slot` attributes.
- **Collision resolution**: If the requested slot is taken, `findNearestAvailableSlot()` scans offset ±1, ±2, etc. If the task will land in a different slot than intended, a confirmation modal is shown.

## Key conventions

- Treat `src/lib/db.js` and `src/lib/schema.js` as the source of truth for persistence behavior. If you add or rename task fields, update both the runtime adapter and the schema/alter SQL together.
- **Supabase gotchas**: `db.js` uses explicit insert/update branching (not `upsert`, which caused duplicates). Null IDs must be destructured out before Supabase inserts (`const { id: _ignored, ...payload } = record`). Both `crypto.randomUUID()` and `crypto.subtle.digest` are HTTPS-only — the app provides fallbacks for HTTP dev servers.
- Preserve the app's offline-first behavior. Features should continue to work without Supabase configured.
- Dates are stored as local `YYYY-MM-DD` strings via helpers in `src/lib/dateUtils.js`. Do not introduce UTC conversions unless you are intentionally changing the planner's local-time behavior.
- Workdays use ISO-like numbering from `1` to `7` (`1 = Monday`, `7 = Sunday`), not JavaScript's native `0` to `6`.
- Task placement is defined by `date`, `hour`, and `slot_index`, where `slot_index` is expected to stay in the `0..4` range for the five-task-per-hour model.
- Task movement metadata matters for downstream UI and stats. When implementing defer/overflow behavior, preserve fields such as `overflowed_from_hour`, `original_hour`, `original_slot_index`, `deferred_from_date`, `completed`, and `dismissed`.
- **Tag system**: Tasks carry a `tag` field (`work|personal|career|fun`). Tags are auto-inferred from task text keywords by `inferTag()` in `TaskItem.jsx` and are manually overridable. Stats and the focus panel break down tasks by tag.
- **Status flags in TaskItem**: Red flag = `isLate` (past hour, not completed, no overflow). Yellow flag = `isDirectOverflow` (moved 1 hour forward). Orange triangle = `isSkippedOverflow` (moved 2+ hours forward).
- Planner interactions are generally optimistic: the UI updates Zustand first and then persists asynchronously. Follow that pattern when extending task actions so the planner stays responsive.
- The focus panel reuses `HourSlot` in `readOnly` mode. If you change task rendering behavior, check both the editable planner and the read-only focus panel.
- Accent styling is not hard-coded per component. Reuse the `accent-bg`, `accent-text`, `accent-border`, and `accent-ring` utilities defined in `src/index.css` and let `ThemeProvider` drive the color through `--accent`.
- **Portal rendering**: TaskItem renders its overflow menu via `createPortal(..., document.body)` with absolute positioning (`transform: translate(-100%, -100%)`). Follow this pattern for menus that need to escape scroll containers.
- **Z-index scale**: `z-30` (header), `z-40` (mobile drawer), `z-50` (modals), `z-[9999]` (portal menus).
- Task notes are stored as HTML, and icon/tag suggestions are inferred from task text. If you change task serialization or editing behavior, keep those derived fields and note rendering in sync.
- This repo is plain JS/JSX, not TypeScript. Existing lint output includes many `react/prop-types` findings, so expect that baseline when validating unrelated changes.
- **Test ID convention**: Components use hierarchical test IDs like `task-item-${hour}-${slotIndex}`, `task-drag-handle-${hour}-${slotIndex}`, `hour-slot-${hour}`.

## E2E test patterns

- Tests seed data by injecting into `localStorage` via `page.addInitScript()`, writing both the raw keys (`ft_settings`, `ft_tasks`) and the Zustand persist key (`five-things-store`).
- The Playwright web server builds with empty Supabase env vars (`VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY=`) to force local-storage mode.
- Drag tests use pointer event helpers (`startPointerDrag`, `hoverHour`) that simulate real pointer movement across multiple steps.
- Assertions target `data-drop-active` and `data-landing-slot` attributes for drag state, and `toContainText` for task placement.

## UI interaction preferences

- Prefer simple, forgiving interactions over technically explicit UI. Do not expose underlying slot mechanics unless the user truly needs them.
- Make drag/drop targets feel large and obvious. Favor whole-card or whole-region targets over small precision targets.
- Keep interaction UI visually calm. Avoid adding helper text, badges, or instructional copy when a clear highlight can communicate the same behavior.
- Prefer smart defaults over manual targeting. The app should choose details like landing slot automatically when it can do so predictably.
- Only interrupt the user when necessary. Use confirmations for real conflicts, such as when the intended landing slot is occupied and the task will fall to a different slot.
- Optimize for readability first. During interactions, keep the planner easy to scan and avoid overlays that make the layout feel busy or crowded.
- Validate interaction-heavy behavior with realistic browser actions whenever possible. Do not rely on synthetic event tests alone when making confidence claims about drag/drop UX.
