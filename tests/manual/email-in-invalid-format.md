# Email in invalid format

## Preconditions
Signup form is loaded.

## Steps
1. Enter a malformed email (e.g. "user@@test" or "usertest.com").
2. Fill the rest of the form validly.
3. Submit.

## Expected Result
The form is rejected with an "invalid email format" error. No account is created.

## Severity
Major

## Status
draft
