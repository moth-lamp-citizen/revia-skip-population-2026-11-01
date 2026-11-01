# The project's own CI artifact carries the live instance

*2026-11-01. The synthetic one-file case is in `repro/`; this directory is the
same cell in Revia's own CI output, at the same pinned commit.*

## The run

| field | value |
|---|---|
| run | [41262134527](https://github.com/regrevia/Revia/actions/runs/41262134527) |
| workflow | Source and release validation (`.github/workflows/validate.yml`) |
| head | `31fc3b4d4f76fe800fdf555ca3472e5f921f9a88` |
| created | 2026-11-01T01:41:35Z |
| conclusion | success |
| artifact 1 | `node-test-population-22.16.0`, id 13065782309 (Node 22.16.0) |
| artifact 2 | `node-test-population-22`, id 13065648036 (Node 22.23.4) |

Both artifacts were downloaded with:

```sh
gh run download 41262134527 -R regrevia/Revia -n node-test-population-22.16.0 -D ci/node-22.16.0
gh run download 41262134527 -R regrevia/Revia -n node-test-population-22 -D ci/node-22
```

The files are stored byte-for-byte as `node-test-population.json` and
`node-test-execution.log`; `run.json` and `run-artifacts.json` are the API
metadata for the run and its artifacts.

## The reconciliation

```sh
node ci/reconcile.mjs ci/node-22.16.0
node ci/reconcile.mjs ci/node-22
```

```
dir ci/node-22.16.0
files 113  tests 971  pass 965  fail 0  skipped 6
report status 0  complete true  node 22.16.0  revision 31fc3b4d4f76fe800fdf555ca3472e5f921f9a88
execution_log_digest sha256:f1783ca5ab77e03700b4d484bdfa683e65608e230f6313e7e400da46b8ab760d
recomputed            sha256:f1783ca5ab77e03700b4d484bdfa683e65608e230f6313e7e400da46b8ab760d  MATCH

file                                                tests  pass  skip  report.outcome
test/llvm-aot-external-evidence.test.js                 5     0     5  passed
test/server-secret-macos-keychain.test.js               9     8     1  passed
```

The Node 22 artifact reports `node 22.23.4` and the same counters; its own log
hashes to `sha256:791e198a2df62e588c66b8b2db9f6ab29ebb339c8b9fa9f584f360fca47f8e26`,
which matches its `execution_log_digest`.

## What the numbers say

- The report's own contract defines `executed` as a selected path whose child
  Node process emitted a non-empty JUnit `tests` count, and `outcome` as the
  child's terminal state. Under that definition the report is conformant: 113
  files emitted 971 tests, every child exited 0, so `status 0` and
  `complete true` are correct.
- The report also records every one of the 113 executions as
  `outcome: "passed"`, including a file whose JUnit counters are
  `tests 5 / pass 0 / skipped 5` and one whose counters are
  `tests 9 / pass 8 / skipped 1`.
- The pass/skip distinction is present only in the JUnit log beside the report.
  The log is digest-bound (`execution_log_digest`), so the evidence is not
  missing; it is not served in a field a reader of the report can use. A
  consumer that reads `executed: 113`, `complete: true`, `passed` and stops
  will overcount passing tests by 6 on this run, and cannot tell a file with
  zero passing tests from one with five.
- The report has no `passed` or `skipped` field at any level, so this is not a
  count that can be reconciled from the JSON alone.

This is the measured instance of `README.md`'s "Why it is not only synthetic"
section. The earlier text predicted a Windows/TLS case; the live case turned out
to be the project's own Linux CI, at a pinned commit, in the artifact that CI
run uploaded.
