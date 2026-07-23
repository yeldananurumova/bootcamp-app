#!/usr/bin/env bash
# PostToolUse hook: warns (never blocks) when a file under server/routes/
# is written or edited and contains a res.json(...) / res.status(...).json(...)
# call that doesn't look like it returns CLAUDE.md's { success, data, error }
# envelope. This is a heuristic line-window scan, not a full JS parser.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [[ -z "$file_path" ]] || [[ "$file_path" != *"/server/routes/"* ]]; then
  exit 0
fi

if [[ ! -f "$file_path" ]]; then
  exit 0
fi

warnings=""

while IFS=: read -r line_num line_text; do
  [[ -z "$line_num" ]] && continue
  window=$(sed -n "${line_num},$((line_num + 6))p" "$file_path")
  if echo "$window" | grep -q 'success' && echo "$window" | grep -q '\bdata\b' && echo "$window" | grep -q '\berror\b'; then
    continue
  fi
  warnings="${warnings}  line ${line_num}: ${line_text}\n"
done < <(grep -nE 'res\.json\(|res\.status\([^)]*\)\.json\(' "$file_path" 2>/dev/null || true)

if [[ -n "$warnings" ]]; then
  message=$(
    {
      echo "check-response-shape.sh: possible {success, data, error} envelope violation"
      echo "File: $file_path"
      printf '%b' "$warnings"
      echo "CLAUDE.md requires every API response to be shaped { success, data, error }."
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
