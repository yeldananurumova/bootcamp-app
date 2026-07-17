# Username with a very long input (500 characters)

## Preconditions
Signup form is loaded.

## Steps
1. Enter a 500-character alphanumeric username.
2. Fill the rest of the form validly.
3. Submit.

## Expected Result
The form is rejected with the same max-length error as the 21-character case. The app does not crash, hang, or truncate silently.

## Severity
Minor

## Status
draft
