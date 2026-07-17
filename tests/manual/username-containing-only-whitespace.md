# Username containing only whitespace

## Preconditions
Signup form is loaded.

## Steps
1. Enter a username of spaces only (e.g. "   ").
2. Fill the rest of the form validly.
3. Submit.

## Expected Result
The form is rejected as if the username were empty, since spaces are not letters or numbers. No account is created.

## Severity
Minor

## Status
draft
