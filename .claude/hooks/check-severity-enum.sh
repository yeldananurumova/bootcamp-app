#!/usr/bin/env bash
# PostToolUse hook: warns (never blocks) when a JS/TS/React file written or
# edited contains a likely-wrong severity value. CLAUDE.md's Severity enum
# is Critical/Major/Minor/Trivial — words like "high", "medium", "low",
# "blocker", "cosmetic" are common wrong substitutes.
#
# Only flags a wrong word when it appears on the SAME line as the word
# "severity" (not a multi-line window) — "high"/"medium"/"low" are valid
# Priority values elsewhere in this codebase, and severity/priority code
# often sits on adjacent lines, so a wider window would false-positive on
# legitimate Priority code.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [[ -z "$file_path" ]]; then
  exit 0
fi

case "$file_path" in
  *.js|*.jsx|*.ts|*.tsx) ;;
  *) exit 0 ;;
esac

if [[ ! -f "$file_path" ]]; then
  exit 0
fi

wrong_words='high|medium|low|blocker|cosmetic'
warnings=""

while IFS=: read -r line_num line_text; do
  [[ -z "$line_num" ]] && continue
  hit=$(printf '%s' "$line_text" | grep -ioE "\b(${wrong_words})\b" | tr '\n' ',' | sed 's/,$//')
  if [[ -n "$hit" ]]; then
    warnings="${warnings}  line ${line_num}: ${line_text}  [possible wrong word(s): ${hit}]\n"
  fi
done < <(grep -niE 'severity' "$file_path" 2>/dev/null || true)

if [[ -n "$warnings" ]]; then
  message=$(
    {
      echo "check-severity-enum.sh: possible wrong severity value"
      echo "File: $file_path"
      printf '%b' "$warnings"
      echo "CLAUDE.md's Severity enum is: Critical, Major, Minor, Trivial."
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
