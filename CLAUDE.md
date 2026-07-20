# bootcamp-app

## Stack
Express server (`server/`, entry `server/index.js`) + React client (`client/`, source in `client/src/`), run together via `npm run dev` at the root.

## Severity Levels
- **Critical** — the app is unusable or a core flow (e.g. login, checkout) is broken for all users.
- **Major** — a significant feature is broken or produces wrong results, but the app is still usable.
- **Minor** — a feature works but behaves incorrectly in a limited or edge-case way.
- **Trivial** — a cosmetic or wording issue with no functional impact.

## Priority Levels
- **Urgent** — fix immediately, ahead of other work.
- **High** — fix soon, before the next release.
- **Medium** — fix in a normal work cycle.
- **Low** — fix when convenient; no pressing timeline.

## Test Case Fields
- **Title** — short, specific name for the test.
- **Preconditions** — state the system must be in before the test starts.
- **Steps** — numbered, one action per step.
- **Expected Result** — what should happen if the test passes.
- **Severity** — Critical, Major, Minor, or Trivial.
- **Status** — draft, ready, passed, failed, or skipped.

## Test Suite Fields
- **Name** — short, specific name for the suite.
- **Feature** — the thing the suite tests (e.g. "login").
- **Status** — draft, ready, in-progress, passed, or failed.
- **Cases** — an ordered list of test cases belonging to the suite.

## Test Run Fields
- **Suite** — the suite this run was created from; its cases are snapshotted at creation time.
- **Status** — in-progress or completed. Becomes completed automatically once every case in the run has a recorded result.
- **Pass / Fail / Skip Counts** — running totals, kept in sync as results are recorded or changed.
- **Result** — per case: passed, failed, or skipped (unset until recorded).
- **Notes** — free text recorded alongside a result.
- Marking a case **failed** opens a GitHub issue in the configured repo (title + notes) and stores the issue URL on that result.

## Bug Report Fields
- **Title** — short, specific name for the bug.
- **Description** — a general description of the bug.
- **Steps to Reproduce** — numbered, one action per step.
- **Expected** — what should have happened.
- **Actual** — what actually happened.
- **Environment** — where it was observed (browser, OS, environment), if known.
- **Severity** — Critical, Major, Minor, or Trivial.
- **Priority** — Urgent, High, Medium, or Low.
- **Status** — open, in-progress, resolved, closed, or reopened. Transitions are restricted: open → in-progress/closed; in-progress → resolved/closed; resolved → closed/reopened; closed → reopened; reopened → in-progress/closed.

## API Response Shape
Every endpoint returns:
```json
{ "success": boolean, "data": any, "error": string | null }
```

## File Naming
- Files: kebab-case (e.g. `user-profile.js`)
- React components: PascalCase (e.g. `UserProfile.jsx`)
- API handlers: `handleVerbNoun` (e.g. `handleCreateUser`)

## Voice
Write all generated test cases and bug reports in clear, direct English. No buzzwords, no filler. State what happened or what should happen — nothing else.
