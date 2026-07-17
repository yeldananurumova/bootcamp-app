# No confirmation dialog before deleting a test case

## Repro Steps
1. Go to the /test-cases page.
2. Open the ⋮ menu on any row.
3. Click Delete.

## Page/Screen
/test-cases

## Expected Result
A confirmation prompt should appear before the test case is permanently deleted, since deletion cannot be undone.

## Actual Result
The test case is deleted immediately on a single click, with no confirmation step and no way to undo the action.

## Severity
Major

## Reported
2026-07-08 19:21
