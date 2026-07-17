---
name: autotest-analyze
description: Classify an autotest failure the user describes and explain the reasoning. Use whenever the user describes a failing automated test and asks what it means, what to do about it, or how to classify/analyze it (e.g. "this test failed, what should I do", "analyze this failure", "why did this autotest fail").
allowed-tools: Read, Grep
---

Classify the autotest failure the user describes into exactly one of these three categories. Explain the reasoning behind the classification, not just the label.

Search `tests/manual/` (using Grep/Read) for a manual test case that covers the same scenario before deciding — match on the feature, the input/action involved, and the expected behavior described, not just keyword overlap in the title.

1. **Regression** — the failure corresponds to a scenario already covered by an existing manual test case in `tests/manual/`. Cite the specific matching file and explain why it matches. Label it `regression`.

2. **To be checked** — the failure does not clearly match an existing manual test case, but it's genuinely ambiguous whether that's a real coverage gap or just a naming/description mismatch with an existing test. Label it `To be checked`.

3. **Not covered by autotest** — the failure clearly represents functionality with no corresponding manual test case at all — a confirmed gap, not just uncertainty. Label it `not covered by autotest`.

Only pick category 2 when you are genuinely unsure after searching — don't default to it just to avoid committing to 1 or 3.

For categories 2 and 3 only, draft a ticket with:
- **Title** — a clear, specific description of the gap.
- **Description** — what's missing and why, referencing what you searched and what you did (or didn't) find in `tests/manual/`.
- **Label** — `to be automated`

Do not draft a ticket for category 1 (regressions are known issues, not coverage gaps).

Output everything as plain text: the classification, the reasoning, and (if applicable) the ticket draft. Do not create files, write to `tests/manual/`, or file anything in an external tracker — this is a draft for the user to review and file themselves.
