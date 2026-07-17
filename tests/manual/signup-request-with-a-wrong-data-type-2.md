# Signup request with a wrong data type

## Preconditions
None - this is exercised at the API level, not through the form.

## Steps
1. Send a signup request to the API with the age field set to a non-numeric string (e.g. "twenty") instead of a number.
2. Observe the response.

## Expected Result
The API rejects the request with a validation error indicating age must be a valid whole number. No account is created.

## Severity
Major

## Status
draft
