# Username containing a disallowed character

## Preconditions
Signup form is loaded.

## Steps
1. Enter a username with a symbol or underscore (e.g. "user_123").
2. Fill the rest of the form validly.
3. Submit.

## Expected Result
The form is rejected with an error stating the username may only contain letters and numbers. No account is created.

## Severity
Major

## Status
draft
