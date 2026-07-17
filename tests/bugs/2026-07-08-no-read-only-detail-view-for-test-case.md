# No read-only detail view for a test case

## Repro Steps
1. Go to the /test-cases page.
2. Click anywhere on a test case's row (outside the ⋮ menu).

## Page/Screen
/test-cases

## Expected Result
Clicking a row should open a read-only detail view showing all of the test case's fields (preconditions, steps, expected result, etc.).

## Actual Result
Rows are not clickable. The only way to see a test case's full details is to open the ⋮ menu and click Edit, which opens the editable form instead of a read-only view.

## Severity
Minor

## Reported
2026-07-08 19:21
