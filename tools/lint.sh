#!/bin/sh
set -eu

tool_dir=$(CDPATH= cd -- "$(dirname "$0")" && pwd)

cc -O3 -std=c11 -Wall -Wextra -o "$tool_dir/lint" "$tool_dir/lint.c"
"$tool_dir/lint" "$@"
# usage:
#   ./tools/lint check
#   ./tools/lint fix
#   ./tools/lint --staged
#   ./tools/lint fix --staged
#   ./tools/lint check path/to/file1.js path/to/file2.js
