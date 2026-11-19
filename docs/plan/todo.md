# 墨梅博客 待办事项（Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办（Todo）
- [x] 已完成（Done）
- [-] 已取消（Cancelled）

---

## 当前进行中阶段

### 第八十阶段：功能与体验收口（筹备中，2026-11-19 立项）

**阶段目标**: 一项用户可见功能（CLI 断点续传）+ 五项体验 / 债务收口（首页缓存解耦、字号第三批、覆盖率第二十一批、PWA 依赖窗口、parity 重采清零）。

**准入结论**: 用户于 2026-11-19 在候选页确认「方案 A」6 条组合，容量 6 条；ROI 均值 `2.00`（断点续传 2.33 / 首页缓存 1.33 / 字号 2.33 / 覆盖率 1.50 / PWA 1.50 / parity 3.00）。首页缓存属受控纳入档（1.0–1.5），保留 kill-switch。

**阶段基线**: 同源 statements `85.97%`（33,622 / 39,105）；`duplicate-code` 0.38%；i18n missing 0 / duplicates 64 组；字号 457 声明（token 139 / 待替换 135）；`coreEntryJs` 281.07KB / 335KB、`keyCss` 59.44KB / 62KB；parity 41 路由 / 82 张参考态，`user-settings` 明暗各 2 条待清零。

**排程与移出顺序**: `3 → 5 → 1 → 4 → 6 → 2`；超时按 `2 → 6 → 4` 移出。

- [ ] **1. CLI 迁移断点续传（P2 功能）**: 为 `momei import` 增加状态文件（默认 `<sourceDir>/.momei-migration-state.json`）、`--resume`、`--state-file`、`--clean-state`；记录路径 / 内容哈希 / 状态 / postId / 错误。
    - **验收标准**: 中断后重跑跳过已成功项、仅重试失败与待处理；哈希变化不误跳过；损坏状态文件可降级；dry-run 不写状态；单测覆盖读写 / 降级 / 哈希 / 续传 / 清理。
    - **非目标**: 不做分布式 / 跨机器续传、失败项自动重试、Web 进度页；不改导入接口。
    - **验证 / 证据**: V0 + V1 + V2 + RG；CLI 定向单测，证据落 `artifacts/review-gate/`。
    - **回滚边界**: CLI 新增模块与参数独立 revert。

- [ ] **2. 首页缓存与语言检测解耦（P2 性能 / SEO，受控纳入）**: 关闭或条件化 `detectBrowserLanguage.useCookie`，`/` 去 `Set-Cookie` 并进入既有 SWR；补五语重定向与显式切换 E2E 及响应头探针。
    - **验收标准**: 本地 preview `/` 无 `Set-Cookie` 且有 `s-maxage`；五语重定向与偏好持久化 E2E 通过、无 hydration 错误；决策文档补齐执行结果；边缘 `cf-cache-status` 验证单列未覆盖边界。
    - **非目标**: 不放宽 nitropack 缓存安全规则、不改 routeRules 时长、不改鉴权 / 会话、不把 Cloudflare Cache Key 写成仓库保证。
    - **验证 / 证据**: V0 + V1 + V2 + V3 + RG；探针 JSON / E2E 日志落 `artifacts/review-gate/`。
    - **回滚边界**: i18n 配置与 E2E 独立 revert；kill-switch 为恢复 `useCookie: true`。

- [ ] **3. 字号归一第三批（P3 视觉）**: 替换 `components/admin/settings` 35 处与 `styles/_onboarding.scss` 的口径内字面量，单批 ≤10 文件；tour 截图取证。
    - **验收标准**: 口径内待替换 135 → ≤100；token 覆盖上升；逐元素 `getComputedStyle` 0 差异；`test:visual` 32/32、parity 83/83 未归因 0。
    - **非目标**: 不改非字阶值、不按现值批量替换、不改暗色 tint、不动 admin-taxonomy。
    - **验证 / 证据**: V1 + V3 + RG；inventory 与对账 / 截图落 `artifacts/review-gate/`。
    - **回滚边界**: 按文件独立 revert。

- [ ] **4. 覆盖率第二十一批（P2）**: 补 `scripts/docs/check-line-count.mjs`（10/56）与 `scripts/testing/probe-build-geometry.mjs`（94/190）的纯函数 / 解析 / 失败路径。
    - **验收标准**: 同源 `+0.3pp`（约 115 条）或模块 ≥85%（`check-line-count` ≥48/56、`probe-build-geometry` ≥162/190）；干净全量 delta 落 `artifacts/coverage/`；定向测试与 flaky 归因完成。
    - **非目标**: 不测真实浏览器 `runRealProbes`、不重构公开行为、不新增测试依赖、不为凑数测模板分支。
    - **验证 / 证据**: V0 + V1 + V2 + RG；`coverage-final.json` 副本。
    - **回滚边界**: 测试与覆盖率产物独立。

- [ ] **5. PWA 依赖窗口与 generateSW 迁移（P2）**: `@vite-pwa/nuxt` 升 `^2.0.2`；`pwa.workbox` → `pwa.generateSW`，保持缓存 / skipWaiting / denylist / glob 语义。
    - **验收标准**: frozen-lockfile 通过；build 无 deprecated 警告；产物 `sw.js` / `workbox-*.js` / manifest 语义一致；`probe:build-geometry` 3/3；`test:visual` 32/32、parity 83/83；安全门禁 Pass。
    - **非目标**: 不改运行时策略与 manifest 内容、不引入新 PWA 能力、不升其他 major。
    - **验证 / 证据**: V0 + V1 + V2 + V3 + RG；构建产物与探针 JSON 落 `artifacts/review-gate/`。
    - **回滚边界**: 依赖声明、锁文件与 `pwa` 段同批 revert。

- [ ] **6. parity 参考态重采与允许清单清零（P2）**: 触发 CI `visual-reference-refresh.yml` 重采 → 覆盖参考态 / manifest → `pnpm prune:parity-allowlist` 落盘 → 复跑 parity 并更新偏差处置表。
    - **验收标准**: 参考态与 manifest 来自同一次 CI run；非空 allowlist 清零；parity 83/83 未归因差异 0；偏差表相应行关闭或改写。
    - **非目标**: 不本地重采作为门禁基线、不改预算阈值、不删 note 历史、不自动重采。
    - **验证 / 证据**: V2 + RG；CI run、prune 输出与 parity 报告落 `artifacts/review-gate/`。
    - **回滚边界**: 参考态、manifest 与预算文件独立 revert。

> 阶段收口门禁: `pnpm regression:phase-close`；任何条目开工前先确认工作区干净并拉取远端。

> 上一阶段归档：第七十九阶段 6 条条目全部完成（2026-11-18 立项并收口），正文见 [roadmap 归档分片](./archive/roadmap-phases-79.md)、条目明细见 [待办事项归档](./todo-archive.md)、阶段结论见 [项目计划](./roadmap.md#第七十九阶段归档结论最近归档阶段)。


## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
