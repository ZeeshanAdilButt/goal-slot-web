# GoalSlot Web: First-time Setup

A complete walkthrough from "I just found this repo on GitHub" to
"I have it running on my laptop". If you have never contributed to an
open-source project before, this guide is for you. Total time is
usually 15 to 30 minutes the first time.

If you get stuck at any step, open an issue with the label
`setup-help` and paste the exact error message you saw. Do not DM.

---

## What you will end up with

By the end of this guide you will have:

- A fork of `goal-slot-web` on your own GitHub account.
- The code cloned to a folder on your laptop.
- All dependencies installed.
- A working `.env.local` file configured for development.
- The dev server running at `http://localhost:3010` showing the login
  page.

You do not need the API repo set up to do most frontend work; the dev
server can point at the staging API at `https://api.goalslot.io`. Set
the API repo up separately if your contribution touches backend code.

---

## Prerequisites

Install these BEFORE you clone the repo. The dev server will not start
without them.

| Tool | Minimum version | How to check | How to install |
|---|---|---|---|
| Node.js | 20.x or 22.x | `node --version` | https://nodejs.org/ (the LTS download) |
| pnpm | 9.x or 10.x | `pnpm --version` | `npm install -g pnpm` after Node is installed |
| Git | Any recent | `git --version` | https://git-scm.com/ |
| A GitHub account | n/a | sign in at github.com | https://github.com/signup |

**Why pnpm and not npm or yarn?** The repo's lockfile is `pnpm-lock.yaml`.
Vercel builds with pnpm. Using a different package manager will
generate a different lockfile and your PR's CI will fail to install.
Just install pnpm once globally and use it from then on.

---

## Step 1: Fork the repo

Forking creates a copy of the repository under your GitHub account.
You make changes in your fork, then send a pull request from your fork
back to the main repo.

1. Open https://github.com/ZeeshanAdilButt/goal-slot-web in your
   browser while signed in to GitHub.
2. Click the **Fork** button in the top-right of the page.
3. On the next page, leave everything as default (your username as
   the owner, same repository name). Click **Create fork**.
4. GitHub will redirect you to your fork. The URL will be
   `https://github.com/YOUR_USERNAME/goal-slot-web`.

You now own a copy of the repo. Future PRs will be opened from this
fork to the upstream.

---

## Step 2: Clone your fork to your laptop

1. On your fork's GitHub page, click the green **Code** button.
2. Select the **HTTPS** tab, then click the copy icon next to the URL.
3. Open a terminal on your laptop:
   - **macOS or Linux**: open the Terminal app.
   - **Windows**: open Git Bash (installed with Git) or PowerShell.
4. Navigate to wherever you keep your code projects:
   ```bash
   cd ~/Projects
   ```
   (Create the folder if it does not exist: `mkdir -p ~/Projects`.)
5. Clone your fork by pasting the URL you copied:
   ```bash
   git clone https://github.com/YOUR_USERNAME/goal-slot-web.git
   ```
6. Move into the cloned folder:
   ```bash
   cd goal-slot-web
   ```

---

## Step 3: Add the upstream remote

This step lets you pull in changes from the main repo so your fork
stays current. Skip it and you will have merge conflicts later.

```bash
git remote add upstream https://github.com/ZeeshanAdilButt/goal-slot-web.git
```

Verify both remotes are set:

```bash
git remote -v
```

You should see four lines: `origin` (your fork, fetch and push) and
`upstream` (the main repo, fetch and push). The main repo is read-only
from your side: you can pull from it but you cannot push to it.

---

## Step 4: Install dependencies

From inside the `goal-slot-web` folder:

```bash
pnpm install
```

The first install takes 2 to 5 minutes and downloads about 600 MB of
packages. You will see a few warnings about peer dependencies and
ignored build scripts. Those are normal, ignore them.

When it finishes you should see a line like
`Done in 3m 12s using pnpm v10.24.0`. If you see an error about a
missing version of Node, check that you installed the version from
the prerequisites table above.

---

## Step 5: Set up environment variables

1. Copy the example file to a local file:
   ```bash
   cp .env.example .env.local
   ```
   On Windows PowerShell: `Copy-Item .env.example .env.local`
2. Open `.env.local` in your editor (VS Code: `code .env.local`).
3. Fill in the values described below. The minimum required for local
   dev is just `NEXT_PUBLIC_API_URL` and `PORT`. Everything else is
   optional for first-time contributors and can stay as placeholders.

### The minimum variables

```env
NEXT_PUBLIC_API_URL=https://api.goalslot.io
PORT=3010
```

`NEXT_PUBLIC_API_URL` points the frontend at the staging backend. This
is fine for most frontend work. Set it to `http://localhost:4000` only
if you also have the API repo running locally.

`PORT` is the port the dev server listens on. Keep it at `3010` unless
something else on your machine is already using it.

### Optional variables you can leave as placeholders

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Only
  needed if you are working on SSO. Leave as `SUPABASE_URL` /
  `SUPABASE_KEY`.
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`: Analytics.
  Leaving them as placeholders disables analytics in local dev, which
  is what you want.
- `NEXT_PUBLIC_DW_SSO_URL`: SSO endpoint, blank by default.

If you ever need real values for any of these (for an SSO-related PR,
for example), ping a maintainer on the relevant issue and we will get
them to you privately.

---

## Step 6: Start the dev server

```bash
pnpm dev
```

After 10 to 30 seconds you should see output like:

```
- ready started server on 0.0.0.0:3010, url: http://localhost:3010
```

Open http://localhost:3010 in your browser. You should see the GoalSlot
login page. If you do, your setup is complete.

To stop the dev server, go back to the terminal and press `Ctrl+C`.

---

## Step 7: Make sure the editor and lint work

Before you write any code, run these once to make sure the toolchain
is healthy:

```bash
pnpm tsc --noEmit
pnpm lint
```

Both should complete with no output (silent success). If either prints
errors and you have not touched any files yet, paste the output in
your setup-help issue. Do not start writing code on a broken baseline.

---

## Common errors and how to fix them

### `pnpm: command not found`

You skipped installing pnpm. Run `npm install -g pnpm` once and try
again.

### `ERR_PNPM_OUTDATED_LOCKFILE`

You ran `npm install` or `yarn install` by mistake, which rewrote the
lockfile in a way pnpm rejects. Delete `node_modules` and the rewritten
lockfile, then run `pnpm install` again:

```bash
rm -rf node_modules package-lock.json yarn.lock
pnpm install
```

### Port 3010 is already in use

Either close whatever is running on 3010, or change the `PORT` value
in `.env.local` to a free port like `3011`.

### The login page loads but I cannot sign in

You are pointing the frontend at `https://api.goalslot.io` (the staging
API). Create a real account at https://app.goalslot.io first if you
want to sign in locally with real data. For most contributions you do
not need to sign in; you can build and test the UI on the login page
or any unauthenticated page.

### I see `ECONNREFUSED ::1:4000`

You set `NEXT_PUBLIC_API_URL=http://localhost:4000` but the API repo
is not running. Either start the API repo (see its `SETUP.md`) or
change `NEXT_PUBLIC_API_URL` back to `https://api.goalslot.io`.

---

## Next steps

You are set up. Now read [CONTRIBUTING.md](CONTRIBUTING.md) to learn
the **claim-before-you-code** flow before you open a PR. That is the
single hardest rule in the project and getting it wrong is the most
common reason a PR gets closed.

Once you have an issue assigned to you, the daily loop is:

1. Pull the latest from upstream into your local main:
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```
2. Create a feature branch:
   ```bash
   git checkout -b feature/short-description
   ```
3. Write code, commit often, run `pnpm tsc --noEmit` and `pnpm lint`
   before each commit.
4. Push your branch:
   ```bash
   git push -u origin feature/short-description
   ```
5. Open a PR from your fork's branch to `ZeeshanAdilButt/goal-slot-web`
   main, with the issue link in the description.

Welcome to the project.
