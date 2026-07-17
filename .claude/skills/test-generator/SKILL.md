---
name: test-generator
description: Generate ISTQB-style test cases using boundary-value analysis and equivalence partitioning. Use whenever the user asks to write, generate, or create test cases or tests for a feature, input, form, field, or endpoint (e.g. "write test cases for X", "generate tests for this feature", "give me boundary tests for Y").
---

Generate a thorough set of ISTQB-style test cases for the feature, input, or field the user describes. Apply boundary-value analysis and equivalence partitioning — do not stop at a single happy-path case.

Cover all of the following categories, skipping a category only if it genuinely does not apply (e.g. "empty" doesn't apply to a boolean toggle):

1. **Happy path** — the normal, expected, valid use of the feature.
2. **Boundary values** — min, max, min-1, max+1, empty, whitespace-only, and a very long input.
3. **Equivalence partitions** — one representative case from each distinct class of valid and invalid input (e.g. valid email formats vs. invalid formats, if the field is an email).
4. **Negative cases** — wrong type, missing required field, duplicate entry.

For each test case, produce all six fields from CLAUDE.md's Test Case Fields section, in this shape:

- **Title** — short, specific name for the test.
- **Preconditions** — state the system must be in before the test starts.
- **Steps** — numbered, one action per step.
- **Expected Result** — what should happen if the test passes.
- **Severity** — Critical, Major, Minor, or Trivial (use CLAUDE.md's exact definitions to judge this, not a guess).
- **Status** — set to `draft` for every freshly generated test case.

Write every field in the plain, direct voice CLAUDE.md specifies: no buzzwords, no filler, just what happens or what's expected.

If the user wants the test cases saved to a file rather than just shown, use the `/new-test` flow's file convention: save under `tests/manual/`, one file per test case, filename derived from the title (lowercase, hyphen-separated).
