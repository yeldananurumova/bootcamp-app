# Verity QA Toolkit

A Claude Code plugin for QA workflows: test case generation, bug triage, flaky test detection, and pre-merge QA review. Built alongside [Verity](../README.md), a test-case/bug-tracking app, and generalizable to any project with a similar QA process.

## Installation

This plugin lives inside the `verity` repo rather than a standalone plugin repo. To use it in another project, copy the `.claude-plugin/`, `commands/`, `agents/`, `skills/`, and `hooks/` directories from this repo's root into your project, or install it from wherever your team publishes it as a Claude Code plugin marketplace entry.

Once installed, restart Claude Code (or start a fresh session) — commands, skills, and hooks are auto-discovered by folder convention; nothing else needs registering.

## Commands

Slash commands that walk you through a structured QA task interactively, one question at a time, and save the result to `tests/`.

| Command | What it does |
|---|---|
| `/new-test` | Walks through creating a manual test case (feature, steps, expected result) and saves it under `tests/manual/`. |
| `/bug-report` | Walks through filing a bug report (repro steps, expected vs. actual) and saves it under `tests/bugs/`. |

## Skills

Skills trigger automatically from natural phrasing — you don't need to name them. Two also ship as delegable agents (see below) for when you want the work handed off rather than done inline.

| Skill | Triggers on | What it does |
|---|---|---|
| `test-generator` | "write test cases for X", "generate tests for this feature", "give me boundary tests for Y" | Generates ISTQB-style test cases (happy path, boundary values, equivalence partitions, negative cases) for a feature, input, or field. |
| `qa-review` | "QA review this", "review my change", "what could break here", "check this before I merge" | Reviews code or a feature from a tester's perspective before merge. |
| `autotest-analyze` | "this test failed, what should I do", "analyze this failure", "why did this autotest fail" | Classifies a described autotest failure and explains the reasoning. |

## Agents

Delegate to these directly, or let Claude pick them up from the same natural phrasing as their skill counterparts.

| Agent | Delegate when | What it does |
|---|---|---|
| `test-writer` | "write test cases for X", "generate tests for this feature" | Produces a full ISTQB-style test suite for a described feature. |
| `qa-reviewer` | "review this", "QA this", "what am I missing" | Returns a prioritized, severity-ordered list of issues for a feature or change. |
| `failure-analyzer` | You paste failing test results, or ask "why did these tests fail" | Classifies a list of autotest failures as regression / to-be-checked / not-covered, and drafts tickets for gaps. |
| `flake-analyzer` | A test is flagged as newly flaky, or you ask "why is this test flaky" | Reviews a flaky test's run history and timing for real patterns and produces a short diagnosis. |

## Hooks

Guardrails that run automatically on every matching tool call — no invocation needed.

| Hook | Fires on | What it does |
|---|---|---|
| `protect-env.sh` | Before any `Write`/`Edit` | Blocks writes to `.env*` files so secrets can't be silently overwritten. |
| `check-response-shape.sh` | After any `Write`/`Edit` | Flags API handlers that don't return the project's `{success, data, error}` envelope. |
| `check-severity-enum.sh` | After any `Write`/`Edit` | Flags severity/priority/status values that don't match the project's fixed enums. |
| `detect-flaky-tests.sh` | After any `Bash` call | Watches test-run output for a case with a mixed pass/fail history and flags it as newly flaky (pairs with the `flake-analyzer` agent). |

## Usage

A typical flow, end to end:

1. Write a feature. Ask **"write test cases for the login form"** — the `test-generator` skill (or `test-writer` agent, if delegated) produces a full boundary/equivalence-partition suite.
2. Before merging, ask **"what could break here?"** — the `qa-review` skill reviews the diff from a tester's perspective.
3. If a manual test needs filing by hand, run `/new-test` and answer the prompts.
4. If something breaks in testing, run `/bug-report` to file it with proper repro steps.
5. If a CI run comes back with failures, paste them in and ask **"can you triage these?"** — the `failure-analyzer` agent sorts real regressions from noise and drafts tickets for gaps.
6. If a test starts passing and failing intermittently, the `detect-flaky-tests` hook flags it automatically, and the `flake-analyzer` agent investigates the run history for you.

See [`examples/`](../examples/) for two real prompts used during development, verbatim.
