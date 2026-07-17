# Age entered as a very long numeric input

## Preconditions
Signup form is loaded.

## Steps
1. Enter a 50-digit number as the age.
2. Fill the rest of the form validly.
3. Submit.

## Expected Result
The form is rejected with the same out-of-range error as the 121 case. The app does not crash, overflow, or hang.

## Severity
Minor

## Status
draft
