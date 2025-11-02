cd "$(dirname "$0")"
cc -O3 -std=c11 -Wall -Wextra -o lint lint.c
./lint
# usage:
#   ./tools/lint check
#   ./tools/lint fix
#   ./tools/lint --staged
#   ./tools/lint fix --staged
#   ./tools/lint check path/to/file1.js path/to/file2.js