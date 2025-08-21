#!/usr/bin/env bash
# Lightweight semicolon linter (no Node) for the Sixarata project.
# Policy: every statement should end with a semicolon unless JavaScript syntax forbids it
# (block openings/closures, control keywords, class/interface declarations, etc).
#
# Usage:
#   ./lint.sh            # run check (non-zero exit on violations)
#   ./lint.sh fix        # attempt auto-fix (adds missing trailing semicolons heuristically)
#
# Limitations: heuristic; may miss edge cases or produce a false positive. Review diffs.

set -euo pipefail
MODE=${1:-check}

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
JS_FILES=$(find "$ROOT_DIR/scripts" -type f -name '*.js' | sort)

missing=()

is_ignorable_line() {
  local line="$1"
  # Remove CR
  line="${line%%$'\r'}"
  # Trim leading spaces (portable)
  local trimmed="${line#"${line%%[![:space:]]*}"}"
  # Blank line
  if [ -z "${trimmed//[[:space:]]/}" ]; then return 0; fi
  # JSDoc / block comment continuation
  [ "${trimmed#* }" != "$trimmed" ] # noop just for readability
  case "$trimmed" in
  const|let|var) return 0 ;;
    \*) return 0 ;;
    \*\ *) return 0 ;;
    //*) return 0 ;;
    /**) return 0 ;;
  esac
  # Leading keywords / constructs that don't need a semicolon.
  case "$trimmed" in
    if\ *|for\ *|while\ *|switch\ *|else|else\ *|try|try\ *|catch\ *|finally\ * ) return 0 ;;
    class\ *|export\ *|import\ * ) return 0 ;;
    function\ *|async\ function\ * ) return 0 ;;
    return\ *|throw\ *|break\ *|continue\ *|yield\ *|await\ * ) return 0 ;;
  esac
  # Trailing chars meaning structure/continuation.
  case "$trimmed" in
    *';') return 0 ;;
    *'{') return 0 ;;
    *'}') return 0 ;;
    *':') return 0 ;;
    *',') return 0 ;;
    *'(') return 0 ;;
    *'=>') return 0 ;;
  esac
  return 1
}

needs_semicolon() {
  local line="$1"
  line="${line%%$'\r'}"
  case "$line" in *';') return 1 ;; esac
  local last_two="${line: -2}"
  local last="${line: -1}"
  [ "$last_two" = '++' ] && return 0
  [ "$last_two" = '--' ] && return 0
  case "$last" in
    [A-Za-z0-9_]) return 0 ;;
    ')'|']'|'"'|"'") return 0 ;;
    \`) return 0 ;;
  esac
  return 1
}

autofix_line() {
  local line="$1"
  if is_ignorable_line "$line"; then
    printf '%s\n' "$line"
    return
  fi
  if needs_semicolon "$line"; then
    printf '%s;\n' "$line"
  else
    printf '%s\n' "$line"
  fi
}

for f in $JS_FILES; do
  lineno=0
  tmpfile="$f.autofix.tmp"
  : > "$tmpfile"
  # Read lines into array manually (portable for bash 3.2)
  lines=()
  while IFS= read -r __l || [ -n "$__l" ]; do
    lines+=("$__l")
  done < "$f"
  total=${#lines[@]}
  in_var_block=0
  in_cond_block=0
  cond_paren_depth=0
  in_return_block=0
  return_paren_depth=0
  for idx in $(seq 0 $((total-1))); do
    raw="${lines[$idx]}"
    next="${lines[$((idx+1))]:-}"
    lineno=$((lineno+1))
    line="$raw"

    # Lookahead: line where next trimmed starts with ')' (likely end of multiline params)
    suppress=0
    next_trimmed="${next#"${next%%[![:space:]]*}"}"
    if [ "${next_trimmed:0:1}" = ')' ]; then
      # Current line is part of params if it lacks trailing , ; and not blank
      if [ -n "${line//[[:space:]]/}" ] && [ "${line: -1}" != ',' ] && [ "${line: -1}" != ';' ]; then
        suppress=1
      fi
    fi

    # Detect start/end of a multi-line const/let/var declaration block.
    trimmed_line="${line#"${line%%[![:space:]]*}"}"
    if [ $in_var_block -eq 0 ]; then
      case "$trimmed_line" in
        const|let|var) in_var_block=1 ;;
      esac
    fi
    # If inside var block, we suppress until we hit a line containing a semicolon.
    if [ $in_var_block -eq 1 ]; then
      case "$line" in *';'*) in_var_block=0 ;; esac
      suppress=1
    fi

    # Multi-line condition (if/while/for) detection using paren depth.
    trimmed_line="${line#"${line%%[![:space:]]*}"}"
    if [ $in_cond_block -eq 0 ]; then
      # Normalize leading '}' (possibly multiple) then spaces for else-if patterns.
      check_line="$trimmed_line"
      # Remove all leading '}' characters.
      while [ "${check_line:0:1}" = '}' ]; do
        check_line="${check_line#?}"
      done
      # Trim leading whitespace after removing braces.
      check_line="${check_line#"${check_line%%[![:space:]]*}"}"
      if echo "$check_line" | grep -Eq '^(if|while|for|else[[:space:]]+if)[[:space:]]*\('; then
        opens=$(printf '%s' "$trimmed_line" | tr -cd '(' | wc -c | tr -d ' ')
        closes=$(printf '%s' "$trimmed_line" | tr -cd ')' | wc -c | tr -d ' ')
        cond_paren_depth=$((opens - closes))
        if [ $cond_paren_depth -gt 0 ]; then
          in_cond_block=1
          suppress=1
        fi
      fi
    else
      opens=$(printf '%s' "$trimmed_line" | tr -cd '(' | wc -c | tr -d ' ')
      closes=$(printf '%s' "$trimmed_line" | tr -cd ')' | wc -c | tr -d ' ')
      cond_paren_depth=$((cond_paren_depth + opens - closes))
      suppress=1
      if [ $cond_paren_depth -le 0 ]; then
        in_cond_block=0
      fi
    fi

    # Multi-line return ( parenthesis block ) detection.
    if [ $in_return_block -eq 0 ]; then
      # Start if line begins with 'return' and has unmatched '('
      if echo "$trimmed_line" | grep -Eq '^return[[:space:]]*\('; then
        ropens=$(printf '%s' "$trimmed_line" | tr -cd '(' | wc -c | tr -d ' ')
        rcloses=$(printf '%s' "$trimmed_line" | tr -cd ')' | wc -c | tr -d ' ')
        return_paren_depth=$((ropens - rcloses))
        if [ $return_paren_depth -gt 0 ]; then
          in_return_block=1
        fi
      fi
    else
      # Continue tracking inside return block.
      ro=$(printf '%s' "$trimmed_line" | tr -cd '(' | wc -c | tr -d ' ')
      rc=$(printf '%s' "$trimmed_line" | tr -cd ')' | wc -c | tr -d ' ')
      return_paren_depth=$((return_paren_depth + ro - rc))
      suppress=1
      if [ $return_paren_depth -le 0 ]; then
        in_return_block=0
      fi
    fi

    # Lines that are pure logical operators or end with them are continuations.
    tl_no_space="${trimmed_line//[[:space:]]/}"
    case "$tl_no_space" in
      '||'|'&&') suppress=1 ;;
    esac
    case "$trimmed_line" in
      *'||'|*'&&') suppress=1 ;;
    esac

    # Multi-line ternary operator suppression: any line whose next line starts with
    # '?' or ':' (continuation of ternary), or lines beginning with '?' / ':' themselves.
    if [ "${next_trimmed:0:1}" = '?' ] || [ "${next_trimmed:0:1}" = ':' ]; then
      suppress=1
    fi
    if [ "${trimmed_line:0:1}" = '?' ] || [ "${trimmed_line:0:1}" = ':' ]; then
      suppress=1
    fi

    if [ $suppress -eq 0 ]; then
      if ! is_ignorable_line "$line" && needs_semicolon "$line"; then
        missing+=("$f:$lineno")
      fi
    fi

    if [ "$MODE" = fix ]; then
      if [ $suppress -eq 1 ]; then
        printf '%s\n' "$line" >> "$tmpfile"
      else
        autofix_line "$line" >> "$tmpfile"
      fi
    fi
  done
  if [ "$MODE" = fix ]; then
    mv "$tmpfile" "$f"
  else
    rm -f "$tmpfile"
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "Missing semicolons detected:" >&2
  printf '  %s\n' "${missing[@]}" >&2
  if [[ "$MODE" == fix ]]; then
    echo "Auto-fix applied where heuristic matched. Review changes." >&2
    exit 0
  else
    echo "Run ./lint.sh fix to attempt automatic insertion." >&2
    exit 1
  fi
else
  echo "No missing semicolons detected." >&2
fi

exit 0
