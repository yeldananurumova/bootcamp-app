---
description: Walk through filing a bug report and save it under tests/bugs/
---

Walk the user through filing a bug report. Ask the following questions **one at a time**, waiting for the user's answer before asking the next:

1. "What did you do?" (exact steps)
2. "What did you expect to happen?"
3. "What actually happened?"
4. "Which page/screen did this happen on?"
5. "(Optional) Any screenshot or recording to reference?" — the user may skip this; if they do, omit that field from the file entirely rather than writing "N/A".

After question 5, ask about severity: propose one of `Critical`, `Major`, `Minor`, `Trivial` based on your best judgment of the bug's impact, explain briefly why, and ask the user to confirm or override it. Only one of those four values is valid.

Determine today's date (check environment/system context for the current date, or run `date +%F` in the shell — do not guess). Derive a short, hyphenated title from the user's answers (e.g. "Login button unresponsive on mobile"). Build the filename as `YYYY-MM-DD-short-title.md` (lowercase, hyphen-separated title). If a file with that name already exists under `tests/bugs/`, append `-2`, `-3`, etc. to avoid overwriting.

The file must follow this exact structure:

```markdown
# {Title}

## Repro Steps
1. {step one}
2. {step two}
...

## Page/Screen
{page or screen}

## Expected Result
{expected result}

## Actual Result
{actual result}

## Reference
{screenshot or recording reference, only if the user provided one}

## Severity
{Critical | Major | Minor | Trivial}

## Reported
{ISO timestamp, e.g. 2026-07-07 14:32}
```

Keep step numbering tight — one action per numbered step, split compound steps apart. Omit the `## Reference` section entirely if the user had nothing to share for question 5. After writing the file, tell the user the exact path you created.
