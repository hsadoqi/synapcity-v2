#!/bin/sh
# Checks pull request text. Reads TITLE and BODY from the environment; set SKIP_BODY=1 to skip the body check.
# 1. The title must be a conventional-commit line, because squash merges use it as the commit subject.
# 2. Title and body must not put a GitHub closing keyword near an issue reference. GitHub ignores negation,
#    so even "not closing #5" closes the issue on merge.
set -eu

status=0
title_pattern='^(chore|feat|fix|docs|refactor|test)(\([a-z0-9._-]+\))?!?: [^ ].*'
keyword='(close[sd]?|closing|fix(e[sd])?|resolve[sd]?)'
ref='(#[0-9]+|/(issues|pull)/[0-9]+)'

if ! printf '%s\n' "${TITLE:-}" | grep -Eq "$title_pattern"; then
  echo "PR title must look like 'type: short summary' (chore, feat, fix, docs, refactor, test). Got: ${TITLE:-}" >&2
  status=1
fi

check_text() {
  label=$1
  text=$2
  if printf '%s\n' "$text" | grep -Eiq "\\b${keyword}\\b[^#]{0,40}${ref}|${ref}[^#]{0,40}\\b${keyword}\\b"; then
    echo "The PR $label puts a GitHub closing keyword near an issue reference. Write 'Related: owner/repo#N' only." >&2
    status=1
  fi
}

check_text title "${TITLE:-}"
if [ "${SKIP_BODY:-0}" != "1" ]; then
  check_text body "${BODY:-}"
fi

exit "$status"
