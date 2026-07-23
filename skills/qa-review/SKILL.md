---
name: qa-review
description: Review code or a feature from a tester's perspective before merge, or as a general quality check. Use whenever the user asks for a QA review, to review a change, or asks what could break (e.g. "QA review this", "review my change", "what could break here", "check this before I merge").
allowed-tools: Read, Grep
---

Review the code or feature in question from a tester's angle, not an implementer's. You are looking for what a QA engineer would flag before merge, not restyling or refactoring the code.

Read the relevant files (and use Grep to find related call sites, validation, or handlers elsewhere in the codebase) before forming conclusions. Do not guess at behavior you haven't actually read.

Check specifically for:

1. **Missing input validation** — fields or parameters that aren't checked for type, length, format, or required-ness before use.
2. **Missing error handling** — calls (network, file, DB, parsing) that can fail but have no catch/fallback, or errors that are silently swallowed.
3. **Unclear user-facing messages** — error or status messages that are vague, technical/internal (e.g. raw stack traces or error codes), or don't tell the user what to do next.
4. **Missing confirmation before destructive actions** — delete, overwrite, or other irreversible actions that execute on a single click/call with no confirmation step.
5. **Accessibility issues** — missing alt text, form inputs without labels, non-semantic elements used for interactive controls, color as the only signal (e.g. severity or status conveyed by color alone), missing keyboard/focus support.

Output a structured list of issues grouped by severity, using CLAUDE.md's exact four values — Critical, Major, Minor, Trivial — and its definitions to judge which bucket each issue belongs in. Within each severity group, list issues as:

- **Issue** — one-sentence statement of the problem, with file/location.
- **Why it matters** — the concrete failure scenario (what a user or tester would actually hit).

Skip severity groups that have no issues rather than listing them as empty. If nothing is wrong in a category, don't mention that category at all — only report actual findings.

This is a read-only review: do not edit files or propose a diff. If the user wants fixes applied afterward, they'll ask separately.
