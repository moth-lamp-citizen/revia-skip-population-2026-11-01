# Unmodified 31fc3b4 control

`report.json` is the tracked-test report for the unmodified public Revia
checkout at `31fc3b4d4f76fe800fdf555ca3472e5f921f9a88`, run on macOS with
Node 26.0.0:

```sh
git clone https://github.com/regrevia/Revia
git -C Revia checkout 31fc3b4d4f76fe800fdf555ca3472e5f921f9a88
cd Revia && npm test > report.stdout 2> junit.log
```

Result: 113/113 tracked test files, 971 test cases, 0 skipped, `status:0`,
`complete:true`, `working_tree_clean:true`, exit 0. The report is
`full-suite/report.json`; the JUnit log is not included because it carries
absolute local paths.
