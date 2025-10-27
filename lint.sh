#!/usr/bin/env bash
# Lightweight semicolon linter (no Node) for the Sixarata project.
# Policy: every statement should end with a semicolon unless JavaScript syntax forbids it
# (block openings/closures, control keywords, class/interface declarations, etc).
#
# Usage:
#   ./lint.sh [check]                # run check (non-zero exit on violations)
#   ./lint.sh fix                    # attempt auto-fix (adds missing trailing semicolons heuristically)
#   ./lint.sh --staged               # only lint staged *.js files (auto-detect mode=check)
#   ./lint.sh fix --staged           # auto-fix only staged *.js files
#   ./lint.sh check file1.js file2.js  # limit to specific files
#
# Tips (pre-commit): add a hook like:
#   #!/usr/bin/env bash
#   exec ./src/lint.sh --staged || exit 1
# This dramatically speeds up runs by linting only changed files.
#
# Limitations: heuristic; may miss edge cases or produce a false positive. Review diffs.

set -euo pipefail
MODE=check
STAGED=0
FILES=()
for arg in "$@"; do
  case "$arg" in
    fix) MODE=fix ;;
    check) MODE=check ;;
    --staged|--cached) STAGED=1 ;;
    -h|--help)
      sed -n '1,80p' "$0"
      exit 0
      ;;
    --) shift; FILES+=("$@" ); break ;;
    -*) echo "Unknown flag: $arg" >&2; exit 2 ;;
    *) FILES+=("$arg") ;;
  esac
done

# If explicit files were passed, don't mix in staged detection
if [ ${#FILES[@]} -gt 0 ]; then
  STAGED=0
fi

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Gather JS files.
gather_files() {
  local gathered=()
  if [ ${#FILES[@]} -gt 0 ]; then
    for f in "${FILES[@]}"; do
      [ -f "$f" ] || { echo "Skipping missing file $f" >&2; continue; }
      case "$f" in *.js) gathered+=("$f") ;; *) ;; esac
    done
    echo "${gathered[@]}"
    return 0
  elif [ $STAGED -eq 1 ]; then
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      while IFS= read -r f; do
        [ -n "$f" ] || continue
        [ -f "$f" ] || continue
        case "$f" in *.js) gathered+=("$f") ;; esac
      done < <(git diff --cached --name-only --diff-filter=ACMR | grep -E '\.js$' || true)
    fi
  fi
  if [ ${#gathered[@]} -eq 0 ]; then
    # Default: full scan (fallback)
    while IFS= read -r f; do
      gathered+=("$f")
    done < <(find "$ROOT_DIR/scripts" -type f -name '*.js' | sort)
  fi
  echo "${gathered[@]}"
}

read -r -a JS_FILES <<<"$(gather_files)"

if [ ${#JS_FILES[@]} -eq 0 ]; then
  echo "No JavaScript files to lint." >&2
  exit 0
fi

missing=()

# --- Performance helpers (avoid spawning external processes in hot loop) ---

# Literal-safe counter (Bash 3.2 friendly)
count_char_lit() { # $1 string, $2 single literal char
  local s=$1 c=$2 cnt=0 i
  for ((i=0; i<${#s}; i++)); do
    [[ "${s:i:1}" == "$c" ]] && ((cnt++))
  done
  printf '%d' "$cnt"
}

starts_return_paren() { # line starts with 'return (' (allow spaces after return)
  local _l=$1
  [[ $_l =~ ^return[[:space:]]*\( ]]
}

# --- Inline comment support -----------------------------------------------
# Strip a trailing inline '//' from a line, but *not* URL schemes like 'http://', 'https://', 'file://'.
# Returns the code portion with trailing whitespace trimmed.
strip_trailing_inline_comment() {
  local s="$1"
  if [[ $s =~ ^(.*[^:/])([[:space:]]*//.*)$ ]]; then
    local code="${BASH_REMATCH[1]}"
    # Trim trailing whitespace from code
    code="${code%"${code##*[![:space:]]}"}"
    printf '%s' "$code"
    return
  fi
  printf '%s' "$s"
}

# Split line into {code}{comment} where comment is a trailing '//' section (avoiding '://').
# If no trailing comment, code = whole line and comment = empty.
split_code_and_comment() {
  local s="$1"
  if [[ $s =~ ^(.*[^:/])([[:space:]]*//.*)$ ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
    printf '%s\n' "${BASH_REMATCH[2]}"
  else
    printf '%s\n' "$s"
    printf '\n'
  fi
}

# Quick per-line delta counts for (), [], {} on code-only (comments removed)
depth_deltas() {
  local s="$1"
  local p_open; p_open=$(count_char_lit "$s" '('); local p_close; p_close=$(count_char_lit "$s" ')')
  local b_open; b_open=$(count_char_lit "$s" '['); local b_close; b_close=$(count_char_lit "$s" ']')
  local c_open; c_open=$(count_char_lit "$s" '{'); local c_close; c_close=$(count_char_lit "$s" '}')
  printf '%d %d %d\n' $((p_open-p_close)) $((b_open-b_close)) $((c_open-c_close))
}

is_ignorable_line() {
  local line="$1"
  # Remove CR
  line="${line%%$'\r'}"
  # Trim leading spaces (portable)
  local trimmed="${line#"${line%%[![:space:]]*}"}"

  # If the line becomes empty after removing a trailing inline comment, it's ignorable.
  local code_only
  code_only="$(strip_trailing_inline_comment "$trimmed")"
  # Blank (after comment removal)
  if [ -z "${code_only//[[:space:]]/}" ]; then return 0; fi

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
  case "$code_only" in
    if\ *|for\ *|while\ *|switch\ *|else|else\ *|try|try\ *|catch\ *|finally\ * ) return 0 ;;
    class\ *|export\ *|import\ * ) return 0 ;;
    function\ *|async\ function\ * ) return 0 ;;
    return\ *|throw\ *|break\ *|continue\ *|yield\ *|await\ * ) return 0 ;;
  esac

  # Trailing chars meaning structure/continuation (evaluate on code_only).
  case "$code_only" in
    *';') return 0 ;;
    *'{') return 0 ;;
    *'}') return 0 ;;
    *':') return 0 ;;
    *',') return 0 ;;   # handles "value, // comment"
    *'(') return 0 ;;
    *'=>') return 0 ;;
  esac
  return 1
}

needs_semicolon() {
  local line="$1"
  line="${line%%$'\r'}"

  # Evaluate only the code portion (ignore trailing inline comments).
  local code_only
  code_only="$(strip_trailing_inline_comment "$line")"

  case "$code_only" in *';') return 1 ;; esac
  local last_two="${code_only: -2}"
  local last="${code_only: -1}"
  [ "$last_two" = '++' ] && return 0
  [ "$last_two" = '--' ] && return 0
  case "$last" in
    [A-Za-z0-9_]) return 0 ;;
    ')'|']'|'"'|"'") return 0 ;;
    \`) return 0 ;;
    ,) return 1 ;;     # comma lines never need a semicolon
  esac
  return 1
}

autofix_line() {
  local line="$1"
  if is_ignorable_line "$line"; then
    printf '%s\n' "$line"
    return
  fi

  # Preserve trailing inline comments by inserting ';' before the comment when needed.
  local code comment
  code="$(split_code_and_comment "$line" | sed -n '1p')"
  comment="$(split_code_and_comment "$line" | sed -n '2p')"

  if needs_semicolon "$line"; then
    if [ -n "$comment" ]; then
      printf '%s;%s\n' "$code" "$comment"
    else
      printf '%s;\n' "$code"
    fi
  else
    printf '%s\n' "$line"
  fi
}

for f in "${JS_FILES[@]}"; do
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

  # Generic running depths across lines
  paren_depth=0
  bracket_depth=0
  brace_depth=0

  for idx in $(seq 0 $((total-1))); do
    raw="${lines[$idx]}"
    next="${lines[$((idx+1))]:-}"
    lineno=$((lineno+1))
    line="$raw"

    # Lookahead and structure tracking
    suppress=0
    next_trimmed="${next#"${next%%[![:space:]]*}"}"

    # Compute code-only then update generic depths
    code_only_line="$(strip_trailing_inline_comment "$line")"
    read dp db dc < <(depth_deltas "$code_only_line")
    paren_depth=$((paren_depth + dp))
    bracket_depth=$((bracket_depth + db))
    brace_depth=$((brace_depth + dc))

    # If inside any open ()/[]/{}, treat as continuation
    if [ $paren_depth -gt 0 ] || [ $bracket_depth -gt 0 ] || [ $brace_depth -gt 0 ]; then
      suppress=1
    fi

    # If the code-only ends with a comma, it's a continuation
    if [[ "$code_only_line" =~ ,[[:space:]]*$ ]]; then
      suppress=1
    fi

    # If next line starts with a closer, treat as continuation
    case "${next_trimmed:0:1}" in
      ')'|']'|'}') suppress=1 ;;
    esac

    # Legacy: line where next trimmed starts with ')' (likely end of multiline params)
    if [ $suppress -eq 0 ] && [ "${next_trimmed:0:1}" = ')' ]; then
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
      if [[ $check_line =~ ^(if|while|for|else[[:space:]]+if)[[:space:]]*\( ]]; then
        opens=$(count_char_lit "$trimmed_line" '(')
        closes=$(count_char_lit "$trimmed_line" ')')
        cond_paren_depth=$((opens - closes))
        if [ $cond_paren_depth -gt 0 ]; then
          in_cond_block=1
          suppress=1
        fi
      fi
    else
      opens=$(count_char_lit "$trimmed_line" '(')
      closes=$(count_char_lit "$trimmed_line" ')')
      cond_paren_depth=$((cond_paren_depth + opens - closes))
      suppress=1
      if [ $cond_paren_depth -le 0 ]; then
        in_cond_block=0
      fi
    fi

    # Multi-line return ( parenthesis block ) detection.
    if [ $in_return_block -eq 0 ]; then
      # Start if line begins with 'return' and has unmatched '('
      if starts_return_paren "$trimmed_line"; then
        ropens=$(count_char_lit "$trimmed_line" '(')
        rcloses=$(count_char_lit "$trimmed_line" ')')
        return_paren_depth=$((ropens - rcloses))
        if [ $return_paren_depth -gt 0 ]; then
          in_return_block=1
        fi
      fi
    else
      # Continue tracking inside return block.
      ro=$(count_char_lit "$trimmed_line" '(')
      rc=$(count_char_lit "$trimmed_line" ')')
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

    # Multi-line ternary operator suppression
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