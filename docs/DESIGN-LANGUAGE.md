# GoalSlot — Design Language

Living reference for the choices we've made so the product reads like one product, not a stack of components. Update as decisions land.

## 1. Brand & palette

| Token | Hex | Role |
| --- | --- | --- |
| Brand yellow | `#f2cc0d` | The one accent. Primary CTAs, focus indicators, status dots, brand chip backgrounds. Never used as a body text colour. |
| Brand yellow hover | `#d9b307` / `#dfb90c` | Pressed/hover state of any brand-yellow surface. |
| Brand yellow tint | `#fffbea` (bg) · `#fff7d1` (deep tint) | Banner / inline highlight backgrounds. Paired with `#f2cc0d/30` borders. |
| Brand yellow text | `#8a7307` (lighter) · `#6b5905` (darker) | The only acceptable text-on-light yellow tone. Use for "live" labels and brand-yellow link hovers. |
| Surface | `#fafafa` | Dashboard background. |
| Ink | `zinc-900` | Primary text, dark pills (Connected, Coach, Journal). |
| Mute | `zinc-500..700` | Secondary text and icon tints. |
| Border / chrome | `zinc-100..300` | Hairlines, dividers, input borders. |

**Never use** raw `emerald-*`/`green-*` for "Connected/Active" type pills — that reads as Bootstrap/AI scaffolding. Use the dark-on-yellow brand pill (see §3) instead.

## 2. Type & sizing

- Default Button: `h-9`, `px-3.5`, `text-sm`. `sm`: `h-8 text-xs`. `lg`: `h-11 text-base`.
- Labels & placeholders: `text-xs`.
- Eyebrows above page titles: `text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500`.
- Tabular numbers (countdowns, scores): always `tabular-nums`.
- One typeface. Weight does the work, not size jumps.

## 3. Status pills

Three patterns. Pick one per surface.

**Brand status (dark pill, the premium one).** Used for *connected provider*, *Coach is on*, *focus-now eyebrow areas*. Dark zinc background, brand-yellow dot, white label with brand-yellow accent word:

```tsx
<span className="inline-flex h-7 items-center gap-1.5 rounded-full border border-zinc-900 bg-zinc-900 px-2.5 text-[11px] font-semibold tracking-tight text-white">
  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#f2cc0d]" />
  OpenAI <span aria-hidden className="text-zinc-500">·</span>
  <span className="text-[#f2cc0d]">Connected</span>
</span>
```

**Neutral status (light pill).** "Not configured", "Draft", "Archived". `border-zinc-300 bg-white text-zinc-700` with a `bg-zinc-400` dot.

**Live banner.** "Checked in today", "Tracking now". `border-emerald-200 bg-emerald-50 text-emerald-700` with a `bg-emerald-500` dot. Emerald is reserved for "we successfully did the thing"; do not use it for connection or quarter pills.

## 4. Iconography

- **Lucide is fine for utility icons** (Clock, ArrowRight, Trash2, Plus). Stroke `1.75–2`, sized `h-3.5..h-5`.
- **Lucide is NOT fine for "branded moments"** — the Coach mark, the Journal action, the Goal flag. Those use custom SVGs we own so the surface doesn't read as off-the-shelf AI chrome.
  - `CoachIcon` → the brand square logo (`/icons/goalslot-icon.svg`).
  - `GoalFlagIcon` → custom summit flag.
  - `FeatherPenIcon` → quick-jot journal floating button.
- **Measurements are typographic, not iconic.** The "Checked in today" summary is `M3 · E4 · F5` chips coloured by the value palette (`rose → green` ramp) — not three lucide faces. Numbers carry meaning; icons carry brand.

## 5. Cards & containers

- Default card: `rounded-xl border border-zinc-200 bg-white shadow-sm`.
- Inline highlight banner (focus now / check-in nudge / release note): `bg-[#fffbea]` with a thin `border-[#f2cc0d]/30` border and a 2px brand-yellow accent or dot.
- Avoid double borders. If a section already has a `GlassCard`, nested rows should be borderless.
- Never style with raw `var(--accents-*)` CSS variables — they resolve dark in our theme and the section becomes unreadable. Use `zinc-*` Tailwind tokens directly.

## 6. Buttons & interaction

- Primary brand action: `variant="brand"` (yellow bg, zinc-900 text).
- Secondary: `variant="secondary"` (white, zinc border).
- Destructive: `variant="destructive"` (rose).
- Dark pill action (Coach trigger, Journal trigger): explicit dark `zinc-900` bg with brand-yellow accent icon — these are *floating* actions, treated as branded affordances.
- Hover lifts (`hover:-translate-y-0.5`) are reserved for floating buttons. Inline buttons just darken.
- Focus ring is always `ring-2 ring-[#f2cc0d] ring-offset-2`.

## 7. Layout chrome (dashboard)

Stacked top-to-bottom inside `SidebarInset`:

1. **TimeEntryBanner** — only when a timer is running.
2. **FocusNowBar** — yellow-tinted live strip when a schedule block is active.
3. **DailyCheckinBanner** — yellow-tinted prompt until today's check-in is logged.
4. **ReleaseNoteBanner** — most recent release note, dismissible.
5. **Page content** (scrolls).

Floating column (bottom-right, fixed): `FloatingJournalButton`, `FloatingCoachButton`, `NotificationsButton`, `Feedback`. Each is a 44px round dark pill with a single branded icon — no text labels on the trigger.

## 8. Form chrome

- Inputs / textareas / dropdown triggers: `text-sm` body, `text-xs` labels, `h-9` (Buttons) or `h-9..auto` (Inputs). Same width inside a grid via `[&>div]:min-w-0` to prevent overflow into siblings.
- Date pickers and popover triggers must `truncate` and accept `min-w-0 max-w-full` inside grid cells — they will otherwise blow out the column at the picker's preferred width.
- Filters apply live where possible. Avoid an explicit "Apply" button for goal/date/task filters; debounce instead.

## 9. Page headers

`<PageHeader>` is two rows: title + actions on row 1 (`justify-between` so actions sit right), description on row 2. Eyebrow above the title in the brand-uppercase voice ("Execute", "Insights", "Plan your week"). Every dashboard page has an eyebrow + title + description — Tasks must match Goals and Schedule.

## 10. Coach surfaces

- The Coach IS the brand — the Coach trigger uses the GoalSlot square logo as its icon, not a generic Sparkles.
- Connection state is shown as a dark brand pill (§3), never as a green Bootstrap badge.
- Chat messages keep author labels minimal (`You` / `Coach`) and put quiet inline actions (Edit, Save as reminder) on the right.
- Proposals are rendered as standalone cards inside the message, with apply / reject state persisted in `localStorage` keyed on `sourceMessageId + actions fingerprint` so the state survives refresh.

## 11. Tone

- Write like a person who is on the user's side, not a coach in inverted commas.
- Prefer concrete verbs ("Check in", "Open journal", "Start tracking") over abstract product-speak ("Begin session").
- Empty states explain *why* the surface is empty and what the user can do, in one short paragraph — never just "No data".

## 12. Don'ts (the things we keep rediscovering)

- No emojis as UI tokens. Letter+number chips or custom SVGs.
- No off-the-shelf lucide icons for *brand moments* (Coach, Journal, Goal flag).
- No green pills for "connected/active" — use the dark brand pill.
- No `var(--accents-*)` CSS vars — they render dark in this theme.
- No "Apply filters" buttons inside filter popovers — apply live.
- No oversized default buttons. `h-9` is the floor.
- No "/profile"-style sub-routes when the page is a tabbed settings surface — use `?tab=profile`.
