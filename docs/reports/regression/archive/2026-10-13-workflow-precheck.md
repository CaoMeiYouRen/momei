# 回归归档：2026-10-13 workflow pre-check（test）

> 来源：`docs/reports/regression/current.md`（2026-10-16 第九次滚动归档：新增组件型目标批次窗口后 `current.md` 越过 `check-line-count` 的 warn>500 线，按「写入前若将越过 warning 线则先归档」口径迁出**未处于阶段活跃面**的非阶段记录）。
> 该窗口为自动化回填的 workflow pre-check 记录，无外部节名锚点引用。

<!-- regression-window:start:workflow-precheck:test:2026-10-13 -->
## 2026-10-13 workflow pre-check（test，自动回填）

- 执行入口: `pnpm run ci:precheck -- --profile=test`
- 证据 artifact: `../../../artifacts/review-gate/2026-10-13-ci-precheck-test.md` / `../../../artifacts/review-gate/2026-10-13-ci-precheck-test.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test critical files=PASS，test environment=PASS，security:validate-overrides=PASS，security:audit-deps=PASS
- Review Gate: `Pass` / `none`；主要问题=无。
- 未覆盖边界: 真实发布凭据链路仍以 GitHub Actions runtime 为准。

<!-- regression-window:end:workflow-precheck:test:2026-10-13 -->
