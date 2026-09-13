# Gameplay Audit (Job 2)

One row per game: what was checked, what was found, what was fixed. Checklist applied to every
game (per `design_handoff/README.md` §Job 2, expanded with Kris's own priorities):

- Start/restart hygiene (timers, listeners, score reset)
- Timers cleaned up on end/restart/`visibilitychange` (backgrounded tab doesn't burn the clock)
- Answer checking: trim/case-normalise, legitimate alternative answers accepted
- Question/word pool: no repeats within a run, real shuffling (Fisher–Yates)
- Edge inputs: empty submit, Enter-to-submit, double-click, answering after time expires
- Scoring: streak resets on wrong answer, submitted score == displayed score
- Mobile: touch targets ≥44px, touch controls on canvas games
- Accessibility: keyboard reachability, focus rings, `aria-live`, reduced-motion
- Pausing works and the game screen is prioritised while a run is in progress (tab-blur behaviour)
- Mode switching (where applicable) is clean — no state bleed between modes
- Leaderboard: score submits correctly, name persists, table renders correctly
- Start/greeting screen gives clear, complete, user-friendly instructions
- Content accuracy: lexical/grammatical correctness, no ambiguous questions, exhaustive accepted-answer sets

Status legend: 🔍 in progress · ✅ audited, clean · 🛠 audited, fixed · ⚠️ audited, issue flagged (not yet fixed)

| Game | Status | Found | Fixed |
|---|---|---|---|
| shared.js (leaderboard system, all games) | 🛠 | The Supabase-backed leaderboard (`submitScore`/`getLeaderboard` in `shared.js`) is intact and live — confirmed by loading the *production* site in a real browser and seeing real student rows (names/scores) render on PhrasalBlitz's board, so nothing about it broke in the Job 1 redesign. Two real bugs found: (1) `handleScoreSubmit` (used by ~12 of the 14 games) had no guard against rapid double-click/double-tap — two quick clicks fired two separate POSTs to Supabase, i.e. could add the same score twice. (2) On a failed submission it replaced the entire form with just an error message, so the player's name was lost and there was no way to retry without restarting the round. (3) Its confirmation/error text used the old theme's bare `.eyebrow` class, which has no styling at all in the new `styles.css` (unlike `--correct`/`--wrong`/`--muted`, which were already aliased for backward compatibility) — so "✓ Score submitted!" rendered as unstyled plain text instead of the small-caps label used everywhere else. Separately, **Affix Runner** and **English Ace** don't use `handleScoreSubmit` at all — they call `submitScore` directly with no confirmation message, no error feedback, and no double-submit guard, so a player has no way to know whether their score actually saved. Also noted: `renderCompactEndCard` in `shared.js` is dead code (zero callers, and built entirely from pre-redesign classes with no styles left) — harmless but worth deleting or repurposing. | Added an in-flight guard to `handleScoreSubmit` (disables the form's controls immediately, ignores a second call while one is pending). On failure it now re-enables the form and appends an error message instead of destroying the player's input. Fixed the `.eyebrow` → `.eg-eyebrow` class. Gave Affix Runner and English Ace the same treatment directly (confirmation text, error text, disable-while-submitting, double-submit guard) since they don't route through the shared helper. Verified via Playwright with a mocked `submitScore` (can't reach the real Supabase endpoint from this sandbox's network) that a rapid double-click results in exactly one call in all three code paths, and that a failed submission leaves the form usable for a retry. Live leaderboard read confirmed by loading the real production PhrasalBlitz page in a real browser. |
| index.html (entry flow) | ⚠️ | All 14 game links resolve correctly; nav anchors (#fast-lane/#arcade/#workshop/#long-game/#leaderboard/#gotw) all hit real elements; game-of-the-week rotation logic (ISO week, ` % 14`) is sound and SVG art swap works; no console/page errors. **Flagged, not fixed:** the leaderboard tile's "Open the board →" is `href="#"` — it doesn't go anywhere (there's no cross-game leaderboard page; each game's board is scoped to its own Supabase rows via `game=eq.<slug>`). The copy ("Every game feeds one shared board... See where you stand this week") implies a real destination that doesn't exist. Needs a decision from Kris: build an aggregate leaderboard page, or soften the copy/CTA so it doesn't read as a broken link. | — |
| PhrasalBlitz | 🛠 | Structural: (1) `ALL_PARTICLES` was a hand-maintained 20-item list used only to generate wrong-answer distractors in Mode 1 — it silently drifted out of sync with the 115-verb/701-pair dataset (missing common particles like "to", "round", "against", "together", "aside", multi-word ones). It never blocked a *correct* answer (that check is always against the verb's own curated list), but it did shrink the distractor pool. (2) No `visibilitychange` handling — the 60s timer kept counting down in a backgrounded tab. (3) Zero `aria-live` regions anywhere — wrong/correct feedback (colour flash + shake) had no text equivalent for screen readers. Content: spot-checked ~15 of the 115 verbs against real-world usage and found 2 genuine gaps — "cut through" and "keep off" were real, commonly-used phrasal verbs missing from their verb's accepted-answer list, so typing them was (correctly, per the game's own data, but wrongly per real English) marked incorrect. **Not fully verified:** a true line-by-line check of all 701 verb+particle pairs against a phrasal-verb dictionary is a much bigger undertaking than one session — flagging as ongoing. | Derived `ALL_PARTICLES` dynamically from the dataset instead of hand-maintaining it. Added the missing "cut through" and "keep off" entries with definitions/examples matching the existing style. Timer now skips its tick while `document.hidden`, so switching tabs no longer burns the clock. Added a shared `.sr-only` utility in `styles.css` plus a `#srStatus` `aria-live="polite"` region wired into every correct/incorrect/round-complete event. Verified via Playwright: new entries are reachable and score correctly in both Mode 1 (click) and Mode 3 (type), timer freezes while hidden and resumes on return, restart resets score/found to 0, no console errors. |
| CollocationCrash | | | |
| SpellIt! | | | |
| Dictation Drill | | | |
| WordChain | | | |
| Word Builder | | | |
| Anagram | | | |
| WordSpark | | Note: the live "WordSpark" game is `synonyms.html` (Supabase keys `wordspark_syn`/`_ant`/`_type`). There is a separate, unrelated `wordspark.html` file still in the repo — not linked from `index.html` or anywhere else, still on the pre-redesign theme (`class="eyebrow"`, no `.eg-*` classes). Looks like a leftover from before the game was rebuilt as `synonyms.html`. Flagging for Kris to confirm it can be deleted — haven't removed it without checking. | — |
| Conditional Constructor | | | |
| Irregular Verb Sprint | | | |
| WordSnake | | | |
| WordDrop | | | |
| Affix Runner | | Leaderboard submit UX fixed early as part of the shared.js pass above (see that row) — full gameplay audit (timers, controls, content accuracy, etc.) still pending. | Partial — see shared.js row. |
| English Ace | | Leaderboard submit UX fixed early as part of the shared.js pass above (see that row) — full gameplay audit still pending. | Partial — see shared.js row. |
