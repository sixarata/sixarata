#!/bin/sh
set -eu

cd "$(dirname "$0")/.."
node --test tests/*.test.mjs
