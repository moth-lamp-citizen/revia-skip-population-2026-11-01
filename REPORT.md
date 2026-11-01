# REPORT — the all-skipped file

*2026-11-01. Source: Revia at `31fc3b4d4f76fe800fdf555ca3472e5f921f9a88`.*

## Claim

A tracked test file whose tests all skip is counted as `executed` and
`passed` by the Revia tracked-test report, and a full run can still report
`complete: true`. The report's own JUnit log carries the distinction
(`pass 0 / skipped 2`); the JSON summary does not.

## Measurement

A throwaway git repo was created with one tracked file,
`test/skipped.test.js`:

```js
import test from 'node:test';
test('skipped one', { skip: true }, () => {});
test('skipped two', { skip: true }, () => {});
```

The public runner was invoked from that repo:

```sh
node <Revia-at-31fc3b4>/scripts/run-tracked-tests.js > report.json 2> junit.log
```

The report (`repro/report.json`):

```json
{
  "status": 0,
  "complete": true,
  "working_tree_clean": true,
  "intended": ["test/skipped.test.js"],
  "discovered": ["test/skipped.test.js"],
  "selected": ["test/skipped.test.js"],
  "executed": ["test/skipped.test.js"],
  "executions": [
    {
      "file": "test/skipped.test.js",
      "status": 0,
      "signal": null,
      "tests": 2,
      "outcome": "passed"
    }
  ]
}
```

The JUnit log (`repro/junit.log`) carries:

```xml
<!-- tests 2 -->
<!-- pass 0 -->
<!-- fail 0 -->
<!-- skipped 2 -->
```

The validator accepts the report:

```sh
REVIA_HOME=<Revia-at-31fc3b4> node repro/validate.mjs
# {"ok":true}
```

## Code path

At `31fc3b4`, `src/toolchain/tracked-test-runner.js`:

```js
// L104-118: the execution entry
const testsRun = parseExecutedTestCount(output)
return {
  file, status: value, signal: termination, tests: testsRun,
  outcome: termination !== null ? 'signaled'
    : testsRun === 0 ? 'no-report'
    : value === 0 ? 'passed'
    : 'failed',
}

// L120-122: executed keeps every file with tests > 0
const executed = executionEvidence
  .filter(({ tests }) => tests > 0)
  .map(({ file }) => file)

// L363-367: only the tests comment is parsed
function parseExecutedTestCount(source) {
  if (typeof source !== 'string') return 0
  const match = /<!--\s*tests\s+([1-9][0-9]*)\s*-->/u.exec(source)
  return match === null ? 0 : Number(match[1])
}
```

The validator repeats the same rule at L294-295 and recomputes `complete` at
L321-325. There is no read of `pass`, `fail`, `skipped` or `todo`.

## Controls

- **Unmodified suite:** `31fc3b4`, 113/113 files, 971 test cases, 0 skipped,
  `complete:true`, `working_tree_clean:true`, exit 0. Report at
  `full-suite/report.json`.
- **Untracked probe:** `test/probe.test.js` added to the one-file repo:
  `intended ["test/skipped.test.js"]`, `discovered ["test/probe.test.js",
  "test/skipped.test.js"]`, `selected ["test/skipped.test.js"]`,
  `executed ["test/skipped.test.js"]`, `status:1`, `complete:false`.
  Report at `repro/untracked-probe-report.json`.

## The Windows/TLS consequence

`test/server-http-client-node-tls-transport.test.js` has two tests. Both begin
with `createLoopbackTlsCredentials()` and call
`t.skip('fixed-path openssl unavailable')` when it returns null.
`test-support/loopback-tls-fixture.js` returns null when neither
`/usr/bin/openssl` nor `/opt/homebrew/bin/openssl` is executable. On Windows,
neither path exists, so both tests skip; the file's JUnit report is
`tests 2 / pass 0 / skipped 2`; the report's `executed` includes it and its
`outcome` is `passed`. This is a code-path prediction, not a Windows run.

## Limit

The reproduction uses a synthetic one-file repo to isolate the cell; the runner
is the public one at `31fc3b4`. The unmodified 113-file control is a real run on
macOS. The all-skipped file is a normal Node pattern; the claim is that the
report's summary fields do not distinguish it from a file whose tests passed.

## What would falsify this

A report where the all-skipped file is absent from `executed`, or
`complete:false`, or `outcome` is not `passed`. None was found.
