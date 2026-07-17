# Signup request with a wrong data type

## Preconditions
None - this is exercised at the API level, not through the form.

## Steps
1. Send a signup request to the API with the username field set to a number (e.g. 12345) instead of a string.
2. Observe the response.

## Expected Result
The API rejects the request with a validation error indicating username must be a string. No account is created.

## Severity
Major

## Status
draft
