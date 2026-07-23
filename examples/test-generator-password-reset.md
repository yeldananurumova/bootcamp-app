# Example: `test-generator` skill — password reset flow

A real prompt used during development of this app, verbatim. The feature (password reset) was never actually built — this shows the skill generating a thorough spec-first test suite for a described flow with no existing implementation to read.

## Prompt

```
/test-generator password reset flow (forgot password → email link/code → set new password). No existing implementation in this codebase; write generic but thorough test cases covering the standard flow: request reset, token/link validation, expiry, new password entry/confirmation, password policy, and edge cases.
```

## What the skill does with it

Per `skills/test-generator/SKILL.md`, it doesn't stop at a single happy-path case. It applies boundary-value analysis and equivalence partitioning across the categories the skill always covers (skipping only what genuinely doesn't apply):

- **Happy path** — request a reset, follow a valid link, set a new valid password, log in with it.
- **Boundary values** — an empty/whitespace-only new password, a password at exactly the minimum/maximum allowed length (and one character under/over), a token used at the instant of expiry.
- **Equivalence partitions** — valid vs. invalid email formats for the reset request; passwords that do/don't meet the policy (length, character classes).
- **Negative cases** — a reused/already-consumed token, an expired token, a malformed token, mismatched password-confirmation fields, requesting a reset for a nonexistent account.

Each case comes back with all six fields from `CLAUDE.md`'s Test Case Fields convention — Title, Preconditions, Steps, Expected Result, Severity, Status — in the project's plain, direct voice, with `Status` set to `draft` for every freshly generated case.
