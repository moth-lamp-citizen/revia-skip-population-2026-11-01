#!/usr/bin/env node
// Reconcile the tracked-test report Revia's release-gate CI uploaded with the JUnit log
// uploaded beside it. The report has one execution per selected file and one digest over the
// exact log bytes; this script checks both, then prints every file whose JUnit pass count is
// below its tests count.
//
// Usage: node ci/reconcile.mjs [ci/node-22.16.0]

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] || "ci/node-22.16.0";
const report = JSON.parse(readFileSync(join(dir, "node-test-population.json"), "utf8"));
const log = readFileSync(join(dir, "node-test-execution.log"));

const sha = "sha256:" + createHash("sha256").update(log).digest("hex");
const digestOk = sha === report.execution_log_digest;

const blocks = log.toString("utf8")
  .split('<?xml version="1.0" encoding="utf-8"?>')
  .filter((b) => b.trim().length > 0);

const rows = blocks.map((block, i) => {
  const counters = (name) => {
    const m = [...block.matchAll(new RegExp("<!-- " + name + " (\\d+) -->", "g"))];
    return m.length ? Number(m[m.length - 1][1]) : null;
  };
  const exec = report.executions[i];
  return {
    index: i,
    file: exec && exec.file,
    tests: counters("tests"),
    pass: counters("pass"),
    fail: counters("fail"),
    skipped: counters("skipped"),
    outcome: exec && exec.outcome,
    reportTests: exec && exec.tests,
    testcases: (block.match(/<testcase\b/g) || []).length,
    skippedCases: (block.match(/<skipped\b/g) || []).length,
  };
});

let bad = 0;
const check = (ok, msg) => { if (!ok) { bad++; console.log("FAIL " + msg); } };
check(digestOk, "execution_log_digest does not match the log bytes");
check(blocks.length === report.executions.length, `blocks ${blocks.length} != executions ${report.executions.length}`);
for (const r of rows) {
  check(r.tests === r.reportTests, `file ${r.file}: tests ${r.tests} != report ${r.reportTests}`);
  check(r.testcases === r.tests, `file ${r.file}: testcase elements ${r.testcases} != tests ${r.tests}`);
  check(r.skippedCases === r.skipped, `file ${r.file}: skipped elements ${r.skippedCases} != skipped ${r.skipped}`);
}

const totals = rows.reduce((a, r) => ({
  tests: a.tests + r.tests, pass: a.pass + r.pass, fail: a.fail + r.fail, skipped: a.skipped + r.skipped,
}), { tests: 0, pass: 0, fail: 0, skipped: 0 });

console.log(`dir ${dir}`);
console.log(`files ${rows.length}  tests ${totals.tests}  pass ${totals.pass}  fail ${totals.fail}  skipped ${totals.skipped}`);
console.log(`report status ${report.status}  complete ${report.complete}  node ${report.node.version}  revision ${report.source_revision}`);
console.log(`execution_log_digest ${report.execution_log_digest}`);
console.log(`recomputed            ${sha}  ${digestOk ? "MATCH" : "MISMATCH"}`);
console.log("");
console.log("file".padEnd(52) + "tests  pass  skip  report.outcome");
for (const r of rows.filter((x) => x.skipped > 0 || x.pass < x.tests)) {
  console.log(String(r.file).padEnd(52) + String(r.tests).padStart(5) + String(r.pass).padStart(6) + String(r.skipped).padStart(6) + "  " + r.outcome);
}
console.log("");
console.log(bad === 0 ? "OK: the log reconciles with the report; the pass/skip distinction exists only in the log." : `${bad} check(s) failed`);
process.exit(bad === 0 ? 0 : 1);
