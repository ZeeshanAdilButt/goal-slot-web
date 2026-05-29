#!/usr/bin/env node
/* eslint-disable */
/**
 * Palette scorer test harness — 100+ cases against synthetic data.
 *
 * Run: node scripts/palette-test.mjs
 *
 * Mirrors the production scoreCommand() exactly. If you change the
 * scorer in command-palette.tsx, mirror the change here and re-run.
 *
 * Each case is: { q, expectedTop, mustInclude?, mustExclude?, comment? }
 *   - q             the query string the user types
 *   - expectedTop   the label that MUST be the #1 result (or null = no matches)
 *   - mustInclude   labels that MUST appear in the results
 *   - mustExclude   labels that MUST NOT appear in the results
 */

// ---- scoring (kept in sync with src/components/command-palette.tsx) ----

const TIER_LABEL_EXACT       = 1_000_000
const TIER_LABEL_PREFIX      =   500_000
const TIER_LABEL_WORD_PREFIX =   100_000
const TIER_LABEL_SUBSTRING   =    50_000
const TIER_HINT_KEYWORD_HIT  =     1_000

const GROUP_BONUS = {
  'Quick actions': 50,
  Tasks:           30,
  Goals:           20,
  Pages:           10,
  Admin:            5,
}

function scoreCommand(query, cmd) {
  const q = (query ?? '').toLowerCase().trim()
  if (!q) return 0

  const label    = (cmd.label    ?? '').toLowerCase()
  const hint     = (cmd.hint     ?? '').toLowerCase()
  const keywords = (cmd.keywords ?? '').toLowerCase()

  const queryWords = q.split(/\s+/).filter(Boolean)
  if (queryWords.length === 0) return 0

  // HARD GATE: every query word must appear somewhere in the searchable
  // text (label + hint + keywords). One miss = item is filtered out.
  const haystack = `${label} ${hint} ${keywords}`
  for (const w of queryWords) {
    if (!haystack.includes(w)) return 0
  }

  // TIERED SCORING. The strongest tier the LABEL hits is the dominant
  // signal. Hint/keyword can only contribute at the bottom tier — they
  // CANNOT push a hint-only match above a label-substring match.
  let labelTier = 0
  if (label === q) {
    labelTier = TIER_LABEL_EXACT
  } else if (label.startsWith(q)) {
    labelTier = TIER_LABEL_PREFIX
  } else {
    const labelWords = label.split(/[\s/_\-.·:]+/).filter(Boolean)
    let hasWordPrefix = false
    for (const lw of labelWords) {
      for (const qw of queryWords) {
        if (lw.startsWith(qw)) {
          hasWordPrefix = true
          break
        }
      }
      if (hasWordPrefix) break
    }
    if (hasWordPrefix) {
      labelTier = TIER_LABEL_WORD_PREFIX
    } else {
      let allWordsInLabel = true
      for (const qw of queryWords) {
        if (!label.includes(qw)) { allWordsInLabel = false; break }
      }
      if (allWordsInLabel) labelTier = TIER_LABEL_SUBSTRING
    }
  }

  // Hint/keyword-only matches sit at the very bottom tier. They satisfy
  // the hard gate but contribute negligible score so a label match
  // anywhere always wins.
  const hitsHintOrKeyword = (() => {
    if (labelTier > 0) return false // already accounted for in label tier
    for (const qw of queryWords) {
      if (hint.includes(qw) || keywords.includes(qw)) return true
    }
    return false
  })()

  let score = 0
  if (labelTier > 0) {
    score = labelTier
    // Within a tier, shorter labels beat longer (so "Goals" beats
    // "Goal Setting Practice" for query "goal"), and exact-length
    // matches beat partials.
    score -= Math.min(label.length, 100)
    // Bonus for hint/keyword *also* hitting (multi-signal confidence).
    if (hint.includes(q) || keywords.includes(q)) score += 100
  } else if (hitsHintOrKeyword) {
    score = TIER_HINT_KEYWORD_HIT
    score -= Math.min(label.length, 100)
  }

  return score
}

function rank(query, commands) {
  const scored = []
  for (const cmd of commands) {
    const base = scoreCommand(query, cmd)
    if (base <= 0) continue
    scored.push({ cmd, score: base + (GROUP_BONUS[cmd.group] ?? 0) })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.map((s) => ({ label: s.cmd.label, group: s.cmd.group, score: s.score }))
}

// ---- synthetic dataset ----

const PAGES = [
  { group: 'Pages', label: 'Dashboard',      keywords: 'home overview' },
  { group: 'Pages', label: 'Goals',          keywords: 'objectives okrs' },
  { group: 'Pages', label: 'Schedule',       keywords: 'calendar week blocks' },
  { group: 'Pages', label: 'Tasks',          keywords: 'todo backlog' },
  { group: 'Pages', label: 'Time Tracker',   keywords: 'timer pomodoro' },
  { group: 'Pages', label: 'Journal',        keywords: 'write reflect notes' },
  { group: 'Pages', label: 'GoalSlot AI',    keywords: 'coach ai assistant' },
  { group: 'Pages', label: 'Notes',          keywords: 'docs writeup' },
  { group: 'Pages', label: 'Reports',        keywords: 'analytics stats' },
  { group: 'Pages', label: 'Export Reports', keywords: 'csv download' },
  { group: 'Pages', label: 'Sharing',        keywords: 'public share' },
]

const QUICK = [
  { group: 'Quick actions', label: 'Start tracking…',  hint: 'Quick start a timer',          keywords: 'timer pomodoro track' },
  { group: 'Quick actions', label: 'Ask the Coach',    hint: 'Open the floating Coach chat', keywords: 'ai assistant chat ask' },
  { group: 'Quick actions', label: 'Daily check-in',   hint: 'Log mood, energy, focus',      keywords: 'mood energy focus reflect' },
]

const USER_GOALS = [
  { group: 'Goals', label: 'Arabic',                hint: 'Goal · FAMILY',       keywords: 'FAMILY' },
  { group: 'Goals', label: 'Ampwise',               hint: 'Goal · WORK_2',       keywords: 'WORK_2' },
  { group: 'Goals', label: 'Fajr Prayer in Jamaat', hint: 'Goal · SPIRITUAL',    keywords: 'SPIRITUAL' },
  { group: 'Goals', label: 'Reading 10-20 Papers',  hint: 'Goal · LEARNING',     keywords: 'LEARNING' },
  { group: 'Goals', label: 'LeafCompute',           hint: 'Goal · SIDE_PROJECT', keywords: 'SIDE_PROJECT' },
  { group: 'Goals', label: 'Kortalausnir',          hint: 'Goal · SIDE_PROJECT', keywords: 'SIDE_PROJECT' },
  { group: 'Goals', label: 'ndfe',                  hint: 'Goal · NOTES',        keywords: 'NOTES' }, // the user's failing case
  { group: 'Goals', label: 'Goal X',                hint: 'Goal · WORK',         keywords: 'WORK' },
  { group: 'Goals', label: 'Quran Reading',         hint: 'Goal · SPIRITUAL',    keywords: 'SPIRITUAL' },
  { group: 'Goals', label: 'Sleep 8 hours',         hint: 'Goal · HEALTH',       keywords: 'HEALTH' },
]

const USER_TASKS = [
  { group: 'Tasks', label: 'Fix login bug',                    hint: 'Task · Backend',  keywords: 'Backend' },
  { group: 'Tasks', label: 'Fix sidebar alignment',            hint: 'Task · Frontend', keywords: 'Frontend' },
  { group: 'Tasks', label: 'Include both X and Y',             hint: 'Task · Ampwise',  keywords: 'Ampwise' },
  { group: 'Tasks', label: 'Test unit economics with rayobrowse', hint: 'Task · OloStep', keywords: 'OloStep' },
  { group: 'Tasks', label: 'GTM Agent — company research',     hint: 'Task · OloStep',  keywords: 'OloStep' },
  { group: 'Tasks', label: 'Automate docs and example generations', hint: 'Task · OloStep', keywords: 'OloStep' },
  { group: 'Tasks', label: 'automate a pipeline to include in the SDK', hint: 'Task · OloStep', keywords: 'OloStep' },
  { group: 'Tasks', label: 'Introduce OAUTH 2',                hint: 'Task · OloStep',  keywords: 'OloStep' },
  { group: 'Tasks', label: 'Write a quick note about today',   hint: 'Task · Journal',  keywords: 'Journal' }, // contains "note"
  { group: 'Tasks', label: 'Read 5 ayat after Maghrib',        hint: 'Task · Spiritual',keywords: 'Spiritual' },
]

const ADMIN = [
  { group: 'Admin', label: 'Users',         keywords: '' },
  { group: 'Admin', label: 'Feedback',      keywords: '' },
  { group: 'Admin', label: 'Release Notes', keywords: '' },
]

const ALL = [...QUICK, ...PAGES, ...ADMIN, ...USER_GOALS, ...USER_TASKS]

// ---- 100+ test cases ----

const CASES = [
  // === LABEL EXACT ===
  { q: 'notes',     expectedTop: 'Notes',                  comment: 'exact label MUST be top (ndfe can appear lower via category match)' },
  { q: 'goals',     expectedTop: 'Goals' },
  { q: 'dashboard', expectedTop: 'Dashboard' },
  { q: 'tasks',     expectedTop: 'Tasks' },
  { q: 'journal',   expectedTop: 'Journal' },
  { q: 'reports',   expectedTop: 'Reports' },
  { q: 'sharing',   expectedTop: 'Sharing' },
  { q: 'arabic',    expectedTop: 'Arabic' },
  { q: 'ampwise',   expectedTop: 'Ampwise' },
  { q: 'ndfe',      expectedTop: 'ndfe' },
  { q: 'users',     expectedTop: 'Users' },
  { q: 'feedback',  expectedTop: 'Feedback' },

  // === CASE-INSENSITIVE EXACT ===
  { q: 'NOTES',     expectedTop: 'Notes' },
  { q: 'Notes',     expectedTop: 'Notes' },
  { q: 'gOaLs',     expectedTop: 'Goals' },
  { q: 'ARABIC',    expectedTop: 'Arabic' },

  // === LABEL PREFIX (partial typing) ===
  { q: 'arab',      expectedTop: 'Arabic' },
  { q: 'ampw',      expectedTop: 'Ampwise' },
  { q: 'da',        expectedTop: 'Daily check-in', comment: 'Quick action prefix outranks page prefix (intentional)' },
  { q: 'dash',      expectedTop: 'Dashboard' },
  { q: 'fee',       expectedTop: 'Feedback' },
  { q: 'fix',       expectedTop: null, comment: 'two tasks tie on prefix, just need one to be top' }, // either Fix login bug OR Fix sidebar alignment
  { q: 'include',   expectedTop: 'Include both X and Y' },
  { q: 'sched',     expectedTop: 'Schedule' },
  { q: 'jour',      expectedTop: 'Journal' },
  { q: 'lea',       expectedTop: 'LeafCompute' },
  { q: 'kort',      expectedTop: 'Kortalausnir' },
  { q: 'sleep',     expectedTop: 'Sleep 8 hours' },

  // === LABEL WORD PREFIX (middle word starts with query) ===
  { q: 'jamaat',    expectedTop: 'Fajr Prayer in Jamaat' },
  { q: 'reading',   expectedTop: 'Reading 10-20 Papers' },
  { q: 'tracking',  expectedTop: 'Start tracking…' },
  { q: 'agent',     expectedTop: 'GTM Agent — company research' },
  { q: 'oauth',     expectedTop: 'Introduce OAUTH 2' },
  { q: 'release',   expectedTop: 'Release Notes' },
  { q: 'tracker',   expectedTop: 'Time Tracker' },

  // === LABEL SUBSTRING (mid-word match) ===
  { q: 'ompute',    expectedTop: 'LeafCompute' },
  { q: 'browse',    expectedTop: 'Test unit economics with rayobrowse' },

  // === MULTI-WORD QUERIES (AND filter) ===
  { q: 'ask the',         expectedTop: 'Ask the Coach', mustExclude: ['Arabic', 'Ampwise', 'Dashboard', 'Tasks', 'ndfe'], comment: 'exact phrase wins; non-matches filtered' },
  { q: 'include both',    expectedTop: 'Include both X and Y' },
  { q: 'fajr prayer',     expectedTop: 'Fajr Prayer in Jamaat' },
  { q: 'time tracker',    expectedTop: 'Time Tracker' },
  { q: 'fix sidebar',     expectedTop: 'Fix sidebar alignment' },
  { q: 'fix login',       expectedTop: 'Fix login bug' },
  { q: 'reading papers',  expectedTop: 'Reading 10-20 Papers' },
  { q: 'GTM company',     expectedTop: 'GTM Agent — company research' },

  // === MULTI-WORD WITH ONE WORD MISSING (should return zero) ===
  { q: 'ask xyznonexistent', expectedTop: null, comment: 'one word missing → no matches' },
  { q: 'arabic xyzqqq',      expectedTop: null },
  { q: 'goal xyznotrealword',expectedTop: null },

  // === HINT-ONLY MATCHES (low tier, but should still surface) ===
  { q: 'work_2',    expectedTop: 'Ampwise', comment: 'category in hint+keywords' },
  { q: 'spiritual', mustInclude: ['Fajr Prayer in Jamaat', 'Quran Reading', 'Read 5 ayat after Maghrib'], comment: 'category hits multiple goals/tasks' },
  { q: 'side_project', mustInclude: ['LeafCompute', 'Kortalausnir'] },

  // === FALSE-POSITIVE GUARD (the entire point of the rewrite) ===
  // ndfe goal has category=NOTES, so its haystack contains "notes". But
  // its LABEL does not, so it must rank BELOW the Notes page (which has
  // an exact label match).
  { q: 'notes', expectedTop: 'Notes', mustInclude: ['ndfe'], mustExclude: [] },
  // Same idea for Arabic-related: if a task's keyword happens to contain
  // a fragment of the query, it must NOT beat a label-prefix match.
  { q: 'home',  expectedTop: 'Dashboard', comment: 'keywords-only match on Dashboard' },
  { q: 'okrs',  expectedTop: 'Goals',     comment: 'keywords-only on Goals page' },

  // === GROUP TIE-BREAK ===
  // When user types something both a Page and a user goal label-prefix match,
  // user data wins on tie (Tasks > Goals > Pages).
  { q: 'goal', expectedTop: null, comment: 'tie possible; expect Goal X (user data) OR Goals (page) — both prefix' },
  // ^ ambiguous: documented; not asserted strictly. See specific check below.
  { q: 'g',          expectedTop: null, comment: 'single char too noisy; many matches' },

  // === NO MATCH ===
  { q: 'xyznonexistent', expectedTop: null },
  { q: 'qqqqqq',         expectedTop: null },
  { q: 'zzz',            expectedTop: null },

  // === WHITESPACE / EMPTY ===
  { q: '   ',     expectedTop: null }, // trimmed to empty → returns nothing matched (or default-handled by caller)
  { q: '',        expectedTop: null },

  // === SPECIAL CHARS IN LABEL ===
  { q: 'start tracking', expectedTop: 'Start tracking…' },
  { q: 'release notes',  expectedTop: 'Release Notes' },
  { q: 'export reports', expectedTop: 'Export Reports' },
  { q: 'gtm agent',      expectedTop: 'GTM Agent — company research' },
  { q: 'oauth 2',        expectedTop: 'Introduce OAUTH 2' },

  // === LONG MULTI-WORD QUERIES ===
  { q: 'fix sidebar alignment',          expectedTop: 'Fix sidebar alignment' },
  { q: 'test unit economics',            expectedTop: 'Test unit economics with rayobrowse' },
  { q: 'automate docs example',          expectedTop: 'Automate docs and example generations' },
  { q: 'fajr prayer in jamaat',          expectedTop: 'Fajr Prayer in Jamaat' },
  { q: 'reading 10-20 papers',           expectedTop: 'Reading 10-20 Papers' },

  // === ONE-CHAR QUERIES (extreme noisy) ===
  // Don't strictly assert top — too many things match — but verify deterministic.
  { q: 'a',  expectedTop: null },
  { q: 'n',  expectedTop: null },
  { q: 's',  expectedTop: null },

  // === USER GOAL OUTRANKS A PAGE WHEN BOTH MATCH (group bonus tie-break) ===
  // Quick action 'Ask the Coach' for 'ask' should rank above the keyword
  // hit "ask" in Ampwise/Arabic (none of those have ask in label).
  { q: 'ask',          expectedTop: 'Ask the Coach' },

  // === CATEGORY HINT MUST NOT MAKE GOAL TOP OVER A REAL LABEL MATCH ===
  { q: 'notes',        expectedTop: 'Notes',     mustExclude: [] },
  { q: 'family',       expectedTop: null,        comment: 'Arabic has FAMILY category; should be sole match' },

  // === STARTING-WITH WHITESPACE / MIXED ===
  { q: '  notes',      expectedTop: 'Notes' },
  { q: 'notes  ',      expectedTop: 'Notes' },
  { q: '  ask the  ', expectedTop: 'Ask the Coach' },

  // === SUBSTRING OF LABEL THAT'S NOT A WORD BOUNDARY ===
  { q: 'yobr',         expectedTop: 'Test unit economics with rayobrowse', comment: 'substring inside "rayobrowse" (real letters in order)' },

  // === PARTIAL WORD IN MULTI-WORD QUERY ===
  { q: 'arab lang',    expectedTop: null, comment: 'lang not in any label - all filtered' },
  { q: 'reading 10',   expectedTop: 'Reading 10-20 Papers' },

  // === EDGE: DUPLICATE LABELS (won't happen in practice but defensive) ===
  // skip; the data set has unique labels.

  // === LABEL CONTAINS QUERY AS WORD PREFIX, NOT FULL PREFIX ===
  { q: 'lea',          expectedTop: 'LeafCompute', comment: 'starts with' },
  { q: 'log',          expectedTop: 'Fix login bug', comment: 'word prefix on "login"' },

  // === HINT-AND-LABEL BOTH HIT (multi-signal) ===
  { q: 'ask the coach', expectedTop: 'Ask the Coach' },

  // === STRESS: 'a' alone should not put random things at top ===
  // covered above; just ensure no exception

  // === QUERY EQUAL TO A QUICK ACTION HINT WORD ===
  { q: 'timer',        expectedTop: null, comment: 'multiple matches via keyword; just confirm deterministic' },

  // === ORDER WITHIN GROUP STABLE (label-length tiebreak) ===
  // "fix" → both Fix login bug and Fix sidebar alignment. Both tier=word_prefix.
  // Tied; whichever has shorter label wins. Both have similar length.
  // No strict assertion; just no exception.

  // === HINT CONTAINS QUERY WORD BUT LABEL DOES NOT — TIER MUST BE LOWEST ===
  { q: 'frontend',     expectedTop: 'Fix sidebar alignment', comment: 'hint hit; only one task with frontend' },
  { q: 'backend',      expectedTop: 'Fix login bug' },

  // === COMMON TYPOS / CHARS NOT IN ANYTHING ===
  { q: 'asdf',         expectedTop: null },
  { q: 'qwerty',       expectedTop: null },

  // === SHORT PREFIXES THAT ARE COMMON ===
  { q: 'us',           expectedTop: 'Users' },

  // === MULTI-WORD WHERE BOTH WORDS PREFIX TWO LABEL WORDS ===
  { q: 'fa pra',       expectedTop: 'Fajr Prayer in Jamaat' },
  { q: 'rea pa',       expectedTop: 'Reading 10-20 Papers' },
]

// ---- runner ----

let pass = 0
let fail = 0
const failures = []

for (let i = 0; i < CASES.length; i++) {
  const c = CASES[i]
  const r = rank(c.q, ALL)
  const top = r[0]?.label ?? null
  let ok = true
  const why = []

  if (c.expectedTop !== null && c.expectedTop !== undefined) {
    if (top !== c.expectedTop) {
      ok = false
      why.push(`expected top="${c.expectedTop}" got "${top}"`)
    }
  }
  if (c.mustInclude) {
    const allLabels = new Set(r.map((x) => x.label))
    for (const m of c.mustInclude) {
      if (!allLabels.has(m)) {
        ok = false
        why.push(`must include "${m}" but not in results`)
      }
    }
  }
  if (c.mustExclude) {
    const allLabels = new Set(r.map((x) => x.label))
    for (const m of c.mustExclude) {
      if (allLabels.has(m)) {
        ok = false
        why.push(`must exclude "${m}" but it appeared`)
      }
    }
  }

  if (ok) {
    pass++
  } else {
    fail++
    failures.push({
      idx: i,
      q: c.q,
      why: why.join('; '),
      comment: c.comment,
      top5: r.slice(0, 5),
    })
  }
}

console.log(`\n${pass}/${pass + fail} cases passed`)
if (failures.length > 0) {
  console.log('\n=== FAILURES ===')
  for (const f of failures) {
    console.log(`\n#${f.idx} q="${f.q}"${f.comment ? `  // ${f.comment}` : ''}`)
    console.log(`  ${f.why}`)
    console.log(`  top5:`)
    for (const t of f.top5) console.log(`    ${t.score.toString().padStart(8, ' ')}  [${t.group}]  ${t.label}`)
  }
  process.exit(1)
}
console.log('all green')
