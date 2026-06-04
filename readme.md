# GoalSlot Web

The web app for [GoalSlot](https://goalslot.io), an open-source goal-driven productivity tool that ties goals, schedule, time tracking, tasks, notes, and reports into one place.

If your todo list is in one app, your calendar in another, your time tracking in a third, and your reflections in a notes app, GoalSlot is the version where they share state. Define goals, block recurring time for each one on a weekly schedule, track time live or log it manually, capture notes against any goal, and at the end of the week see whether your hours actually matched your intentions.

- **Live app:** https://app.goalslot.io
- **Live API:** https://api.goalslot.io
- **Backend repo:** [goal-slot-api](https://github.com/ZeeshanAdilButt/goal-slot-api)

## What it does

| Module | What it covers |
|---|---|
| **Goals** | Kanban-style goals with deadlines, progress, categories, labels, and linked tasks |
| **Weekly schedule** | Recurring time blocks (Deep Work, Learning, etc.) tied to specific goals |
| **Time tracker** | Live timer with start/stop, plus manual entry, linked to schedule blocks |
| **Tasks** | Daily and per-goal task lists with priority and status |
| **Notes** | Rich Tiptap editor with slash commands, sub-bullets, drag-and-drop sidebar, markdown export |
| **Coach AI** | Optional Socratic layer using your own OpenAI, Anthropic, or Gemini key (BYOK), with a shared fallback for users without a key |
| **Reports** | Daily, weekly, and monthly focus charts and CSV exports |
| **Sharing** | Per-goal and per-report public links plus email invites |
| **Integrations** | Notion (in progress, [#190](https://github.com/ZeeshanAdilButt/goal-slot-web/issues/190)), Whiteboards (in progress, [#203](https://github.com/ZeeshanAdilButt/goal-slot-web/issues/203)), `goalslot` CLI (open scope, [api#27](https://github.com/ZeeshanAdilButt/goal-slot-api/issues/27)) |
| **Auth** | Email + OTP, Google OAuth (in progress), token refresh, optional Supabase SSO |
| **PWA** | Installable progressive web app |
| **Analytics** | Optional PostHog integration |

## Why open source?

Most productivity tools either own your data or rent it back to you. GoalSlot is open source, self-hostable, and contributor-driven. The roadmap lives on the public issue board, not behind a paywall.

## New here? Start with these two files

1. **[SETUP.md](SETUP.md)** walks you from "I just found this repo on GitHub" to "I have the dev server running at localhost:3010" in 15 to 30 minutes. Covers forking, cloning, env vars, install, run, and the common errors with fixes.
2. **[CONTRIBUTING.md](CONTRIBUTING.md)** is the contribution flow. **Read it before you write any code.** The single hard rule is **claim-before-you-code**: pick an open issue, comment to claim it, wait for a maintainer to assign it to you, then open the PR. Skipping the claim step results in the PR being closed, even if the code is good, because we already promised the work to whoever is assigned.

Looking for something to take? Browse the [open issues](https://github.com/ZeeshanAdilButt/goal-slot-web/issues) and filter on labels `good first issue` or `help wanted`. The backend has its own backlog at [goal-slot-api/issues](https://github.com/ZeeshanAdilButt/goal-slot-api/issues). Cross-repo features (touching both web and api) are tracked with linked PRs that ship together.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS, Radix UI primitives, shadcn/ui patterns |
| Language | TypeScript |
| State | Zustand for client state, TanStack Query for server state |
| HTTP | Axios with shared auth interceptor |
| Editor | Tiptap 3 with custom extensions (Notion-style blocks, indent, slash commands) |
| Drag and drop | dnd-kit |
| Command palette | cmdk |
| Charts | Recharts |
| Analytics | PostHog (optional) |
| Package manager | **pnpm** (do not use npm or yarn; the lockfile is `pnpm-lock.yaml`) |

## Quick start

Full walkthrough including Postgres-free development against the staging API is in [SETUP.md](SETUP.md). TL;DR:

```bash
git clone https://github.com/YOUR_USERNAME/goal-slot-web.git
cd goal-slot-web
pnpm install
cp .env.example .env.local
# edit .env.local: NEXT_PUBLIC_API_URL=https://api.goalslot.io, PORT=3010
pnpm dev
```

App at http://localhost:3010.

## Architecture

```
┌─────────────────┐       HTTP (REST + JWT)         ┌─────────────────────────┐
│  goal-slot-web  │ ──────────────────────────────► │      goal-slot-api      │
│  (this repo)    │   NEXT_PUBLIC_API_URL           │    (NestJS + Prisma)    │
│   Next.js 16    │   default: api.goalslot.io      │  Postgres via Supabase  │
└─────────────────┘                                 └─────────────────────────┘
```

Optional integrations: PostHog for analytics, Supabase SSO, Notion (in progress).

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server with hot reload on port 3010 |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build on port 3010 |
| `pnpm lint` | ESLint |
| `pnpm tsc --noEmit` | Type-check without emitting |

## Project layout

```
goal-slot-web/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── dashboard/      # Authenticated app
│   │   ├── login/
│   │   ├── signup/
│   │   ├── share/          # Public share links
│   │   └── auth/callback/  # OAuth callback (Google, etc.)
│   ├── components/         # Shared UI primitives
│   ├── features/           # Goals, time-tracker, notes, reports, coach, sharing, settings
│   ├── hooks/              # Shared React hooks
│   ├── lib/                # API client, stores, utilities
│   └── content/            # MDX/Markdown guides
├── public/                 # Static assets, PWA icons
├── SETUP.md                # First-time setup walkthrough
├── CONTRIBUTING.md         # Contribution flow (READ BEFORE WRITING CODE)
└── readme.md               # This file
```

## Questions

Open a discussion or comment on the relevant issue. For setup help specifically, see the troubleshooting section in [SETUP.md](SETUP.md) or open a new issue with label `setup-help`.
