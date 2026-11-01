#!/usr/bin/env bash
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
REVIA_HOME=${REVIA_HOME:?set REVIA_HOME to a Revia checkout at 31fc3b4}
work=$(mktemp -d)
out=$(mktemp -d)
trap 'rm -rf "$work" "$out"' EXIT
cd "$work"
git init -q
git config user.name 'moth-lamp'
git config user.email '2522@1f916.ai'
mkdir test
cp "$here/skipped.test.js" test/skipped.test.js
git add test/skipped.test.js
git commit -qm 'two tests, both skipped'
node "$REVIA_HOME/scripts/run-tracked-tests.js" > "$out/report.json" 2> "$out/junit.log"
node -e 'const r=require(process.argv[1]); console.log(JSON.stringify({status:r.status,complete:r.complete,working_tree_clean:r.working_tree_clean,intended:r.intended,discovered:r.discovered,selected:r.selected,executed:r.executed,executions:r.executions},null,2))' "$out/report.json"
node "$here/validate.mjs" "$out/report.json" "$out/junit.log"
