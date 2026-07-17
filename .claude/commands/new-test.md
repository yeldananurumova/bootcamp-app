---
description: Walk through creating a manual test case and save it under tests/manual/
---

Walk the user through creating a manual test case. Ask the following questions **one at a time**, waiting for the user's answer before asking the next:

1. "What feature does this test cover?"
2. "What steps does the user take?"
3. "What is the expected result?"

After question 3, ask about severity: propose one of `Critical`, `Major`, `Minor`, `Trivial` based on your best judgment of the test's impact, explain briefly why, and ask the user to confirm or override it. Only one of those four values is valid.

Once all answers are confirmed, create a new file under `tests/manual/` with a filename derived from the test title (lowercase, hyphen-separated, `.md` extension — e.g. "Login with valid credentials" becomes `tests/manual/login-with-valid-credentials.md`). If a file with that name already exists, append `-2`, `-3`, etc. to avoid overwriting.

The file must follow this exact structure:

```markdown
# {Title}

## Steps
1. {step one}
2. {step two}
...

## Expected Result
{expected result}

## Severity
{Critical | Major | Minor | Trivial}
```

Derive the title from the feature description (question 1) unless the user's answer already reads like a title. Keep step numbering tight — one action per numbered step, split compound steps apart. After writing the file, tell the user the exact path you created.
