# Signup request missing a required field entirely

## Preconditions
None - this is exercised at the API level, not through the form.

## Steps
1. Send a signup request to the API with the password key omitted from the payload entirely (not just an empty string).
2. Observe the response.

## Expected Result
The API rejects the request with a validation error indicating password is required. No account is created.

## Severity
Major

## Status
draft
