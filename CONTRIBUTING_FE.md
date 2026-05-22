# Contributing — Frontend (`goal-slot-web`)

Thanks for taking the time to contribute. This guide covers everything
specific to the **`goal-slot-web`** Next.js app: how to set it up
locally, where the code lives, how to add pages and features, and how
to get a frontend change reviewed and merged.

If you're working on the API, see `CONTRIBUTING_BE.md` instead.
For project-wide policies (code of conduct, PR templates), the root
`CONTRIBUTING.md` is the source of truth — this file repeats the
parts you actually need while doing frontend work.

If anything here is unclear, open a discussion or issue — fixing a
confusing onboarding step is itself a great first contribution.

---

## Table of contents

1. [Code of conduct](#code-of-conduct)
2. [Repository layout](#repository-layout)
3. [Ways to contribute](#ways-to-contribute)
4. [Development setup](#development-setup)
5. [Picking an issue](#picking-an-issue)
6. [Branching and commit conventions](#branching-and-commit-conventions)
7. [Code style](#code-style)
8. [Testing](#testing)
9. [Opening a pull request](#opening-a-pull-request)
10. [Reporting bugs](#reporting-bugs)
11. [Proposing a feature](#proposing-a-feature)
12. [Getting help](#getting-help)

---

## Code of conduct

Be kind, be patient, and assume good faith. Goal Slot follows the
[Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
Harassment, personal attacks, or discriminatory language are not welcome
in issues, pull requests, or any community channel. Report violations
to the maintainers privately.

---

## Repository layout

The frontend is a **Next.js 16** app using the App Router, **React 19**,
**Tailwind CSS**, **TanStack Query** for server state, **Zustand** for
client state, and **axios** for HTTP. Code is organised by *feature*
rather than by file type — when you add a new page, almost everything
it needs lives in a single `src/features/<name>/` folder.

```
goal-slot-web/
├── .env.example                Template for required environment variables
├── .gitignore
├── .prettierignore             Paths skipped by Prettier
├── .prettierrc                 Prettier config (import sort, tailwind plugin)
├── components.json             shadcn/ui generator config
├── eslint.config.mjs           ESLint flat config (Next + Tailwind plugins)
├── instrumentation.js          Next.js server-side instrumentation hook
├── instrumentation-client.ts   Next.js client-side instrumentation hook (PostHog)
├── next.config.js              Next config (PWA, images, headers)
├── next-env.d.ts               Auto-generated Next.js type shim — do not edit
├── package.json                Scripts + dependencies
├── pnpm-lock.yaml              Lockfile — do not hand-edit
├── postcss.config.js           PostCSS + Tailwind pipeline
├── readme.md                   Project intro
├── tailwind.config.ts          Tailwind theme, plugins, content globs
├── tsconfig.json               TypeScript compiler options + path aliases
│
├── .github/
│   └── workflows/              CI pipelines (lint, build, deploy)
│
├── business_images/            Static marketing/branding assets used at build time
├── public/                     Files served verbatim at the site root (icons, manifest, fonts)
├── scripts/                    One-off Node scripts (codegen, asset prep)
│
└── src/
    ├── app/                    Next.js App Router — folder = URL segment
    │   ├── layout.tsx          Root layout (HTML shell, providers)
    │   ├── page.tsx            Marketing/landing page (`/`)
    │   ├── globals.css         Tailwind base + custom CSS
    │   ├── global-error.tsx    App-wide error boundary
    │   ├── posthog-server.js   Server-side analytics init
    │   │
    │   ├── login/              `/login`
    │   ├── signup/             `/signup`
    │   ├── forgot-password/    `/forgot-password`
    │   ├── faq/                `/faq`
    │   ├── privacy/            `/privacy`
    │   ├── guides/
    │   │   └── [slug]/         `/guides/<slug>` (MDX-driven)
    │   ├── share/
    │   │   └── accept/         `/share/accept` (share-invite landing)
    │   │
    │   └── dashboard/          Authenticated app shell
    │       ├── layout.tsx      Sidebar + auth guard
    │       ├── page.tsx        Dashboard home
    │       ├── goals/          `/dashboard/goals`
    │       ├── tasks/          `/dashboard/tasks`
    │       ├── time-tracker/   `/dashboard/time-tracker`
    │       ├── schedule/       `/dashboard/schedule`
    │       ├── reports/        `/dashboard/reports` (+ `/export`)
    │       ├── notes/          `/dashboard/notes` (+ `/[id]`)
    │       ├── sharing/        `/dashboard/sharing`
    │       ├── settings/       `/dashboard/settings`
    │       └── admin/          `/dashboard/admin/...` (users, feedback, release-notes)
    │
    ├── components/             Shared, app-wide UI — NOT feature-scoped
    │   ├── ui/                 shadcn primitives (button, dialog, input, …)
    │   ├── block-editor/       Custom block-based editor for notes
    │   ├── tiptap-editor/      Tiptap-based rich text editor
    │   ├── DateRangePicker/    Reusable date-range picker
    │   ├── guides/             Components specific to the /guides surface
    │   ├── app-sidebar.tsx     Dashboard sidebar
    │   ├── goalslot-logo.tsx
    │   ├── confirm-dialog.tsx
    │   ├── virtualized-list.tsx
    │   └── …                   Other cross-feature widgets
    │
    ├── features/               One folder per product area; this is where most work happens
    │   ├── goals/
    │   │   ├── index.ts        Barrel export
    │   │   ├── components/     UI: list, item, modal, filters, stats, banners
    │   │   ├── hooks/          TanStack Query hooks (queries + mutations)
    │   │   └── utils/          Query keys, types, helpers
    │   ├── tasks/              (same shape) Task board, item, sidebar, sublists
    │   ├── time-tracker/       Timer UI + entries
    │   ├── schedule/           Weekly grid + schedule blocks
    │   ├── reports/            Charts, filters, export
    │   ├── notes/              Tree of notes, editor wrapper
    │   ├── sharing/            Share dialogs, accept flow, public-link mgmt
    │   ├── categories/         Goal-category CRUD
    │   ├── labels/             Goal-label CRUD
    │   ├── feedback/           In-app feedback widget + admin views
    │   ├── notifications/      Notification feed
    │   ├── release-notes/      Changelog popover
    │   ├── dashboard/          Dashboard widgets
    │   └── home/               Marketing-page sections
    │
    ├── content/
    │   └── guides/             MDX source for /guides pages
    │
    ├── hooks/                  Generic React hooks (not feature-scoped)
    │   ├── use-click-outside.ts
    │   ├── use-infinite-scroll-observer.ts
    │   ├── use-local-storage.ts
    │   ├── use-mobile.tsx
    │   └── use-timer-notifications.tsx
    │
    ├── lib/                    App-wide singletons and helpers
    │   ├── api.ts              axios instance + every `*Api` helper (backend ↔ frontend)
    │   ├── store.ts            Zustand stores (auth, UI)
    │   ├── use-timer-store.ts  Timer-specific Zustand store
    │   ├── react-query-provider.tsx  TanStack Query QueryClientProvider
    │   ├── date-range-utils.ts
    │   ├── escape-html.ts
    │   ├── guides.ts           MDX loader for /guides
    │   └── utils.ts            `cn()` + small helpers
    │
    └── utils/
        └── posthog/            PostHog client-side helpers
```

### Anatomy of a feature folder

Every folder under `src/features/<name>/` follows the same layout.
Using `goals/` as the canonical example:

```
goals/
├── index.ts                    Public barrel export — what the rest of the app imports
├── components/                 React components, all feature-scoped
│   ├── goals-page.tsx          The top-level component the route renders
│   ├── goals-list.tsx
│   ├── goal-item.tsx
│   ├── goal-modal.tsx
│   ├── goals-filters.tsx
│   ├── goals-header.tsx
│   ├── goals-stats.tsx
│   └── goals-limit-banner.tsx
├── hooks/                      TanStack Query wrappers around `lib/api.ts`
│   ├── use-goals-queries.ts    `useQuery` hooks (read)
│   └── use-goals-mutations.ts  `useMutation` hooks (write)
└── utils/
    ├── queries.ts              Query keys + invalidation helpers
    └── types.ts                TypeScript types for this feature
```

The route file in `src/app/dashboard/goals/page.tsx` is usually just:

```tsx
'use client'
import { GoalsPage } from '@/features/goals'
export default GoalsPage
```

All real work happens inside the feature folder. This keeps the
App Router tree thin and lets you grep `features/<name>/` to see
*everything* about one product area.

### Wiring rules

| When you…                              | You must also…                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Add a new dashboard page               | Create the folder under `src/app/dashboard/<name>/` **and** the feature folder under `src/features/<name>/`. The route file should just re-export the feature's page component. |
| Add a new backend endpoint helper      | Add the function to `src/lib/api.ts` (don't call `axios`/`fetch` from components directly).   |
| Add a new env var                      | Add it to `.env.example`. Browser-readable vars must start with `NEXT_PUBLIC_` to be inlined. |
| Add a new shared UI primitive          | Drop it under `src/components/ui/` (shadcn style). Feature-specific UI stays inside `src/features/<name>/components/`. |
| Add a new generic hook                 | Put it in `src/hooks/`. Feature-specific hooks live in `src/features/<name>/hooks/`.          |
| Add a new server-state query           | Wrap the API call with `useQuery` / `useMutation` inside the feature's `hooks/` folder — never call `api.foo()` from a component. |
| Need new client state                  | Extend an existing Zustand store in `src/lib/store.ts`, or add a feature-scoped store under `src/features/<name>/store/`. |

### Key files at a glance

| File / folder              | Why it matters                                          |
| -------------------------- | ------------------------------------------------------- |
| `src/lib/api.ts`           | Every backend call lives here — axios instance + helpers |
| `src/lib/store.ts`         | Global Zustand stores (auth, UI)                        |
| `src/app/layout.tsx`       | Root layout — providers, fonts, metadata                |
| `src/app/dashboard/layout.tsx` | Auth guard + sidebar shell                          |
| `src/features/`            | Where almost all UI and product logic lives             |
| `src/components/ui/`       | shadcn primitives — reach for these first               |
| `tailwind.config.ts`       | Theme tokens, content globs                             |
| `next.config.js`           | PWA, images, headers, redirects                         |

---

## Ways to contribute

You don't have to write code to help. Useful contributions include:

- **Bug reports** with clear reproduction steps.
- **Documentation fixes** — typos, missing steps in this guide,
  unclear comments, outdated examples.
- **Triage** — reproducing reported bugs, labelling issues, asking
  reporters for missing info.
- **Feature proposals** — open a discussion first; we'd rather agree on
  the shape of a change before you write it.
- **Code** — bug fixes, new features, refactors, tests, performance
  work. Small, focused PRs are easier to review than large ones.

---

## Development setup

Follow these steps end-to-end on a fresh checkout before opening
your first PR. If any step doesn't work on your machine, that's
almost certainly a bug in this guide and a perfect first
contribution — open an issue or PR with the fix.

`goal-slot-web` is the Next.js 16 app that listens on port **3010**
and renders the user-facing UI. It calls the backend (`goal-slot-api`)
at `http://localhost:4000/api` for every piece of data, so for any
real interaction (login, listing goals, time tracking) you'll need
the backend running too.

> **Working on UI in isolation?** The app boots without the backend,
> but anything that needs an API call will fail. You can still
> develop static pages (`/`, `/faq`, `/privacy`, `/guides/*`) and
> visually iterate on components. For everything else, follow
> `CONTRIBUTING_BE.md` once to get the API running, then come back
> here.

### Step 1 — Prerequisites (install once)

Minimum versions: **Node.js ≥ 20**, **pnpm ≥ 9**.

**Node.js.** Check your current version:

```bash
node --version
```

If missing or below 20, install via [nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# restart your shell, then:
nvm install 20
nvm use 20
```

**pnpm:**

```bash
npm install -g pnpm
pnpm --version
```

### Step 2 — Install dependencies

From the repo root:

```bash
cd goal-slot-web
pnpm install
```

This reads `pnpm-lock.yaml` and installs the exact versions that
were committed. The first install can take a few minutes because of
the Tiptap, Radix, and Next.js dependency graph.

### Step 3 — Configure environment

Copy the example and open the result in your editor:

```bash
cp .env.example .env.local
```

Set the following values:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:4000
PORT=3010
NEXT_PUBLIC_SUPABASE_URL=http://localhost
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
NEXT_PUBLIC_DW_SSO_URL=
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Important rules for env vars:

- `NEXT_PUBLIC_API_URL` is the **backend base URL** without the
  trailing `/api` — `src/lib/api.ts` appends `/api` itself. Set it
  to whatever host:port your `goal-slot-api` is listening on
  (default: `http://localhost:4000`).
- Variables that start with `NEXT_PUBLIC_` are **inlined into the
  browser bundle** at build time. Never put a secret here.
- Server-only secrets (PostHog personal API key, etc.) belong in
  the un-prefixed slot below `NEXT_PUBLIC_*` in `.env.example`.
- After editing `.env.local`, **restart `pnpm dev`** — Next.js
  reads env at boot and won't pick up changes via hot-reload.

### Step 4 — Start the dev server

```bash
pnpm dev
```

This runs `next dev -p 3010` (the port is hardcoded in
`package.json` — changing `PORT` in `.env.local` alone won't move
it). Open <http://localhost:3010> in your browser.

If you have the backend running and seeded, log in with
`admin@devweekends.com` / `SuperAdmin123!`. You should land on
`/dashboard`. If you don't have the backend running, you'll see
the marketing page and can navigate static routes like `/faq` and
`/privacy` — anything that hits the API will surface a network
error in the console.

### Day-to-day commands

From **`goal-slot-web/`**:

| Command          | What it does                                            |
| ---------------- | ------------------------------------------------------- |
| `pnpm dev`       | Next.js dev server with HMR on port 3010                |
| `pnpm build`     | Production build (runs TypeScript check + bundling)     |
| `pnpm start`     | Run the production build locally on port 3010          |
| `pnpm lint`      | ESLint over the whole project                           |
| `pnpm lint:fix`  | ESLint with `--fix`                                     |
| `pnpm format`    | Prettier-format all files                               |
| `pnpm format:check` | Prettier in check-only mode (CI-style)               |

### Troubleshooting

**API calls fail with `ERR_CONNECTION_REFUSED`.** The backend isn't
running on the URL `NEXT_PUBLIC_API_URL` points at. Start
`goal-slot-api` (see `CONTRIBUTING_BE.md`) and confirm the port
matches.

**API calls fail with a CORS error in the browser console.** The
backend's `CORS_ORIGIN` doesn't include your frontend origin. Either
run the frontend on `http://localhost:3010` (the default the backend
allows), or edit `goal-slot-api/.env` to add your origin to
`CORS_ORIGIN` (comma-separated) and restart the API.

**Environment variable change had no effect.** Next.js inlines
`NEXT_PUBLIC_*` at boot. Kill `pnpm dev` and start it again; HMR
will not re-read `.env.local`.

**`pnpm dev` says "port 3010 is already in use".** Something is
already bound to 3010 — usually a previous `pnpm dev` you forgot to
stop. Find it with `lsof -i :3010` and kill the process, or edit
the `dev` script in `package.json` to use a different port (then
also update `CORS_ORIGIN` on the backend so requests aren't
blocked).

**Type errors show up in `pnpm build` but not in your editor.**
Your editor is using a stale TypeScript service. Restart the TS
server (in VS Code: *TypeScript: Restart TS server*). If
`next-env.d.ts` has changed, do not commit local edits to it — it's
regenerated on every build.

**A `'use client'` component triggers "Module not found" or
hydration errors.** Common cause: importing a browser-only API
(localStorage, window) inside a component that isn't marked
`'use client'`. Move the import behind a `useEffect`, or add
`'use client'` at the top of the file.

**Auth keeps redirecting to `/login`.** The 401 interceptor in
`src/lib/api.ts` clears tokens and redirects when the refresh
endpoint also fails. Open DevTools → Application → Local Storage
and confirm `accessToken` is set after login. If the refresh call
is 401-ing immediately, the backend may be running against a
different database than the one your tokens were issued from.

---

## Picking an issue

1. Browse open issues at
   [`/issues`](../../issues).
2. Look for labels that fit your level:
   - **`good first issue`** — small, well-scoped, low context required.
   - **`help wanted`** — the team has decided it should be done but
     isn't actively working on it.
   - **`bug`** / **`enhancement`** — broader buckets, may need a design
     discussion first.
3. Drop a comment saying you'd like to take it. Wait for a maintainer
   (or the original reporter) to confirm before starting — this avoids
   two people doing the same work.
4. If nothing on the issue tracker matches what you want to work on,
   open a new issue describing the problem or proposal before writing
   code. PRs that arrive without prior discussion are still welcome,
   but they may be sent back if the direction doesn't fit the
   roadmap.

---

## Branching and commit conventions

### Branch from `main`

```bash
git checkout main
git pull
git checkout -b <type>/<short-description>
```

Use one of these prefixes so the branch's intent is obvious:

| Prefix      | Use for                                   |
| ----------- | ----------------------------------------- |
| `feat/`     | New user-visible feature                  |
| `fix/`      | Bug fix                                   |
| `refactor/` | Code change with no behaviour change      |
| `docs/`     | Documentation only                        |
| `test/`     | Tests only                                |
| `chore/`    | Tooling, dependencies, CI                 |

Examples: `feat/weekly-report-export`, `fix/login-401-on-refresh`,
`docs/setup-postgres-ubuntu-24`.

### Commit messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/)
style. The first line is:

```
<type>(<optional scope>): <short, imperative summary>
```

- `type` is one of `feat`, `fix`, `refactor`, `docs`, `test`, `chore`,
  `perf`, `style`, `build`, `ci`.
- `scope` is the area of the code, e.g. `auth`, `goals`, `web`, `api`.
- Summary is **imperative mood**, lowercase, no trailing period.
  Write "add weekly export" not "added weekly export" or "Adds…".

Examples:

```
feat(reports): add CSV export to weekly summary
fix(auth): clear refresh token when password is rotated
docs(setup): document pg_hba peer-auth gotcha on Ubuntu 24
chore(deps): bump prisma from 7.4.1 to 7.5.0
```

Keep one logical change per commit. If a reviewer asks you to revise,
**amend or squash** rather than tacking on "address review" commits —
the merged history should read as a clean story.

---

## Code style

Style is enforced by linters and formatters — don't argue with the
tools, run them.

### Linters & formatters

```bash
pnpm lint           # ESLint
pnpm format         # Prettier --write
pnpm build          # full TypeScript + Next.js compile — run before opening a PR
```

### TypeScript

- **Strict mode is on.** No `any` unless commented with a
  justification.
- Prefer `unknown` + narrowing over `any` for response payloads.
- Use the path alias `@/` (configured in `tsconfig.json`) for
  imports inside `src/`. Don't use long relative paths like
  `../../../lib/api`.

### React & Next.js

- **Functional components with hooks only.** No class components.
- **Server vs client components.** Default to server components;
  add `'use client'` *only* when the component actually needs state,
  effects, refs, or browser APIs. Marking a tree client-side
  unnecessarily blows up bundle size and disables RSC streaming.
- **Route files stay thin.** A `src/app/dashboard/<name>/page.tsx`
  should usually just re-export the feature's page component:

  ```tsx
  'use client'
  import { GoalsPage } from '@/features/goals'
  export default GoalsPage
  ```

- **No `useEffect` for data fetching.** Use TanStack Query — `useQuery`
  for reads, `useMutation` for writes. Put the hook in
  `src/features/<name>/hooks/`.

### State management

- **Server state** (anything that lives on the backend) belongs in
  TanStack Query. Cache keys live in
  `src/features/<name>/utils/queries.ts`.
- **Client/UI state that survives across pages** belongs in a
  Zustand store. App-wide stores are in `src/lib/store.ts`; feature-
  scoped stores live under `src/features/<name>/store/`.
- **Local component state** stays as `useState` / `useReducer`. Don't
  promote it to a global store unless two unrelated components need it.

### Styling

- **Tailwind utility classes** for layout, spacing, colour. No
  inline `style={{ … }}` for things Tailwind already covers.
- Conditional classes use the `cn()` helper from `src/lib/utils.ts`
  (a `clsx` + `tailwind-merge` wrapper) so duplicate utilities
  resolve correctly.
- **Shared primitives** live in `src/components/ui/` and follow
  shadcn conventions. Reach for those before writing a new button,
  dialog, or input from scratch.
- Theme tokens (colours, radii, spacing) are defined in
  `tailwind.config.ts` and `src/app/globals.css`. Don't introduce
  one-off hex values in components.

### Data fetching

- **All backend calls go through `src/lib/api.ts`.** When you need
  a new endpoint, add a helper to the appropriate `*Api` export and
  consume it from a TanStack Query hook. Never `axios.get(…)` from
  inside a component.
- Errors from the axios interceptor (401 → refresh → redirect to
  `/login`) are handled centrally. Don't reimplement that logic per
  call.

### Forms & validation

- For non-trivial forms, validate at the boundary — usually with the
  same DTO contract the backend enforces. Surface server-side
  validation errors next to the relevant field, not in a global
  toast.

### Accessibility

- Every interactive element must be keyboard-reachable.
- Use the Radix-based primitives from `src/components/ui/` — they
  ship with proper focus management and ARIA attributes.
- Images need an `alt`. Buttons that contain only an icon need an
  `aria-label`.

### Cross-cutting

- No commented-out code in the diff. If you want to keep it for
  reference, save it elsewhere; git will remember.
- Comments explain *why*, not *what*. Well-named identifiers cover
  the "what".
- No personal credentials or `.env` values in commits. The
  `.gitignore` already excludes `.env`; double-check `git status`
  before committing.

---

## Testing

The frontend does not yet ship an automated unit/integration test
runner. Until that lands, every PR must pass two gates before
review:

```bash
cd goal-slot-web
pnpm lint           # ESLint with the Next + Tailwind plugins
pnpm build          # full TypeScript compile + production bundle
```

`pnpm build` is the strongest signal we have today — it catches
type errors, missing imports, server/client boundary violations,
and Next.js config issues that `pnpm dev` would let slide.

### Manual verification

Until automated tests exist, treat manual verification as a first-
class deliverable in your PR description. For any user-visible
change:

- List the **routes you exercised** (e.g. `/dashboard/goals`,
  `/dashboard/reports?week=…`).
- Note the **viewport sizes** you tested (mobile, desktop) if the
  change touches layout.
- Note the **auth states** you tested (logged in, logged out, plan
  gated, admin) if the change touches any guarded surface.
- Include before/after screenshots or a short screen recording for
  visual changes.

### Adding tests when the infrastructure exists

If you're touching a feature that already has tests (e.g. utility
functions in `src/lib/`), keep them passing and extend them:

- **Bug fix** → add a regression case that fails before your fix.
- **New utility** → add unit tests next to it as `*.test.ts`.
- **New component** → if a future test framework is wired up (React
  Testing Library, Playwright), include component-level tests.

If a flaky test blocks you and you're sure it's not related to your
change, mention it in the PR description rather than silently
disabling it.

---

## Opening a pull request

1. Push your branch and open a PR against `main`.
2. Use this template in the PR description:

   ```markdown
   ## Summary
   <one-paragraph description of what changed and why>

   ## Related issue
   Closes #<issue-number>

   ## Type of change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Refactor
   - [ ] Docs
   - [ ] Other: …

   ## How I tested this
   <commands run, manual steps, screenshots if UI>

   ## Checklist
   - [ ] Linked the issue this PR resolves
   - [ ] Added/updated tests
   - [ ] `pnpm lint` and `pnpm test` pass locally
   - [ ] Updated docs (READMEs, this CONTRIBUTING guide, code
         comments) where needed
   - [ ] No `.env`, secrets, or generated files committed
   ```

3. Keep PRs small. If your change touches more than ~400 lines outside
   of generated files (lockfiles, migrations), consider splitting.
4. Mark the PR as **draft** while you're still iterating. Mark it
   **ready for review** when CI is green and you'd be happy for it to
   merge as-is.
5. Be responsive to review comments. Stuck on one? Say so — silence
   is harder to help with than "I don't know how to fix this".

The maintainers aim to give a first response within a week. Pings
after that are welcome.

---

## Reporting bugs

A good bug report includes:

- **What you did** — exact commands, URLs, or UI steps.
- **What you expected** — the behaviour you thought you'd see.
- **What actually happened** — error messages copy-pasted as text
  (not screenshots of terminals), stack traces, screenshots for UI.
- **Environment** — OS, Node version (`node --version`), pnpm
  version, browser if it's a UI bug.
- **Reproduction** — minimum steps to reproduce, ideally on a fresh
  clone with seeded data.

If you can include the failing request/response pair (browser
DevTools → Network → copy as cURL), that often cuts triage time in
half.

---

## Proposing a feature

Before you build something non-trivial, open a discussion or an
issue tagged **`enhancement`** describing:

- The problem the feature solves (user-facing, not implementation).
- Who it affects and how often.
- A rough sketch of the proposed UX or API.
- Any alternatives you considered.

The team will reply with feedback or a green light. This step
protects your time — there's nothing worse than landing a 500-line
PR only to learn the direction doesn't match the roadmap.

---

## Getting help

- **Setup not working?** → re-read the *Development setup* and
  *Troubleshooting* sections above, then open a GitHub Discussion
  with the exact command you ran and the full error output.
- **Stuck on an issue you're working on?** → leave a comment on the
  issue; tag the maintainer who triaged it.
- **Security report** → do **not** open a public issue. Email the
  maintainers (see repo profile) with details and reproduction.

Welcome aboard, and thanks again for helping make Goal Slot better.
