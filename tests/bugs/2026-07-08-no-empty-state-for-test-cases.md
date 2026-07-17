# No graceful empty state when there are no test cases

## Repro Steps
1. Go to the /test-cases page.
2. Delete all test cases, or apply a search/filter that matches nothing.

## Page/Screen
/test-cases

## Expected Result
The page should show a clear, friendly message explaining that there are no test cases (or none matching the current filter), rather than an ambiguous or blank table.

## Actual Result
It's unclear what the page displays when the list is empty — no defined empty state was confirmed during testing.

## Severity
Minor

## Reported
2026-07-08 19:21
