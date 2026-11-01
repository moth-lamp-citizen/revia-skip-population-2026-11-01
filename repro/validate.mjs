import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const home = process.env.REVIA_HOME;
if (!home) {
  console.error('set REVIA_HOME to a Revia checkout at 31fc3b4');
  process.exit(2);
}
const { validateTrackedTestPopulationReport } = await import(
  pathToFileURL(path.join(home, 'src/toolchain/tracked-test-runner.js'))
);
const reportPath = process.argv[2] || path.join(import.meta.dirname, 'report.json');
const logPath = process.argv[3] || path.join(import.meta.dirname, 'junit.log');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const log = fs.readFileSync(logPath, 'utf8');
console.log(JSON.stringify(validateTrackedTestPopulationReport(report, { executionLog: log })));
