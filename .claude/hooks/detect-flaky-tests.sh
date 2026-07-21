#!/usr/bin/env bash
# PostToolUse hook: warns (never blocks) after a Bash command, checking
# whether any test case now has both a 'passed' and a 'failed' result across
# its recorded test_run_results rows — that's this feature's definition of
# "flaky". Bash is the realistic way test_run_results gets written during a
# session (curl against the API, a seed script, direct sqlite3), so that's
# the matcher rather than Write|Edit.
#
# Only alerts for tests NOT already recorded in the flaky_tests table (see
# server/db.js) — that's what makes this "newly identified" rather than a
# repeat alert on every Bash call forever. This hook cannot itself invoke the
# flake-analyzer subagent (a hook is a shell script; only Claude can make an
# Agent tool call) — it only detects, records, alerts Discord directly, and
# prints a systemMessage prompting Claude to run the subagent next.

input=$(cat)
# input is read and discarded — the check re-queries current DB state
# unconditionally rather than trying to sniff whether this specific Bash
# command was a test-result write.

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
db_path="$repo_root/server/data.sqlite"

if [[ ! -f "$db_path" ]]; then
  exit 0
fi

flaky_ids=$(sqlite3 "$db_path" "
  SELECT test_case_id FROM test_run_results
  WHERE result IN ('passed', 'failed')
  GROUP BY test_case_id
  HAVING COUNT(DISTINCT result) = 2;
" 2>/dev/null)

if [[ -z "$flaky_ids" ]]; then
  exit 0
fi

webhook_url=$(grep -m1 '^DISCORD_WEBHOOK_URL=' "$repo_root/.env" 2>/dev/null | cut -d= -f2-)

new_flaky=""

while IFS= read -r test_case_id; do
  [[ -z "$test_case_id" ]] && continue

  already_known=$(sqlite3 "$db_path" "SELECT 1 FROM flaky_tests WHERE test_case_id = $test_case_id;" 2>/dev/null)
  if [[ -n "$already_known" ]]; then
    continue
  fi

  title=$(sqlite3 "$db_path" "SELECT title FROM test_cases WHERE id = $test_case_id;" 2>/dev/null)

  sqlite3 "$db_path" "INSERT INTO flaky_tests (test_case_id, first_detected_at) VALUES ($test_case_id, datetime('now'));" 2>/dev/null

  if [[ -n "$webhook_url" ]]; then
    discord_message="🔁 Flaky test detected: \"${title}\" (test case #${test_case_id}) — passed in one run, failed in another."
    payload=$(jq -n --arg content "$discord_message" '{content: $content}')
    curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$webhook_url" >/dev/null 2>&1
  fi

  new_flaky="${new_flaky}  test case #${test_case_id}: \"${title}\"\n"
done <<< "$flaky_ids"

if [[ -n "$new_flaky" ]]; then
  message=$(
    {
      echo "detect-flaky-tests.sh: newly flaky test(s) found"
      printf '%b' "$new_flaky"
      if [[ -n "$webhook_url" ]]; then
        echo "Posted to Discord. Consider investigating with the flake-analyzer subagent."
      else
        echo "DISCORD_WEBHOOK_URL is not set in .env, so no Discord alert was sent. Consider investigating with the flake-analyzer subagent."
      fi
    }
  )
  # stderr: visible in logs / headless runs
  echo "$message" >&2
  # stdout JSON with systemMessage: the mechanism the Claude Code UI actually
  # surfaces regardless of exit code — plain stderr text on an exit-0 hook
  # is treated as silent success and never shown to the user.
  jq -n --arg msg "$message" '{systemMessage: $msg}'
fi

exit 0
