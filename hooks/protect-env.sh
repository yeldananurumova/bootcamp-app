#!/usr/bin/env bash
# PreToolUse hook: blocks Write/Edit calls that target .env or .env.* files
# (e.g. .env.local, .env.production) — these contain secrets (API keys,
# webhook URLs, tokens). Exits 2 to block the tool call and send the
# warning back to Claude, which must get explicit user confirmation before
# retrying.

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)

if [[ -z "$file_path" ]]; then
  exit 0
fi

base=$(basename "$file_path")

case "$base" in
  .env|.env.*)
    {
      echo "protect-env.sh: blocked an edit to $file_path"
      echo "This file may contain secrets (API keys, webhook URLs, tokens)."
      echo "Double-check this change with the user before proceeding — confirm explicitly, then retry."
    } >&2
    exit 2
    ;;
  *)
    exit 0
    ;;
esac
