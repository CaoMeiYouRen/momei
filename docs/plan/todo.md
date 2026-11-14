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

**第七十六阶段：内容与编辑体验收口、首页缓存决策与质量基线（条目 1 / 2 / 3 / 4 / 5 / 6 待办）**

> 阶段规划、准入结论、ROI、回滚边界与风险提示见 [项目计划](./roadmap.md)；立项 2026-11-15，用户确认「方案 A：内容与编辑体验」6 条组合（Phase C / SWR / 正则清理低于 1.5 准入线，经用户确认受控纳入）。开工前置：`HEAD=03d9d769` 的 CI 全绿（Test / Docker / VitePress / CodeQL / TODO）。

- [x] **1. 设置表单 AI Image Fallback 4 项（P2）**
    - **执行范围**: `AI_IMAGE_FALLBACK_PROVIDER` / `API_KEY` / `MODEL` / `ENDPOINT` 补 `SETTING_ENV_MAP`、`.env.full.example` 示例与 `ai-settings.vue` 控件（挂在 `ai_image_enabled` 组内，沿用 `SettingFormField` + `metadata.isLocked`）；五语翻译补齐。
    - **非目标**: 不暴露基础设施密钥；不改 `FORCED_ENV_LOCKED_KEYS`；不新增 AI Provider。
    - **验收标准**: 4 个 key 可从 env 读入并后台编辑（锁定态只读）；保存后 `/api/ai` fallback 链路读取一致；五语 parity 0；映射无遗漏 / 重复。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；设置页定向测试、`i18n:check-sync` / `audit:missing`，证据写入 `artifacts/review-gate/`。
    - **回滚边界**: 类型 / 映射 / 表单 / 翻译同批 revert。

- [x] **2. JekyllParser 适配器（P2）**
    - **执行范围**: `packages/cli/src` 新增 `JekyllParser`（YAML front-matter），复用 `ContentParser` 与 `import-command` 的 `--format`，同步帮助文本；单测覆盖 title / date / tags / categories / content 与缺字段。
    - **非目标**: 不支持在线 API 导入、自动格式检测、主题 / 插件迁移。
    - **验收标准**: `--format=jekyll` 正确选择；`--help` 含 jekyll；五字段映射正确；Hexo / Hugo / WordPress 无回归；CLI 定向测试通过。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；解析器单测与 CLI 导入冒烟。
    - **回滚边界**: 新增文件与 `--format` 分支独立回滚。

- [ ] **3. 编辑器工具栏 Phase C — AI 审校合并（P2）**
    - **执行范围**: 新建 `PostEditorConsolidatedReviewPanel`（双 Tab + editor/reader 切换），前端编排 `/api/ai/review` 与 `/api/ai/perspective-check`，替换现有两个侧面板；保留服务端 API 关注点分离；必要时补 `usePostEditorAI` 并发抑制或按 kill-switch 退回顺序调用。
    - **非目标**: 不合并服务端 API；不改 MavonEditor 工具栏 / 编辑器布局 / AI 计费；不新增 Provider。
    - **验收标准**: 单按钮触发两次调用并统一展示；两 Tab 与旧面板等价；失败 / 部分失败可读降级；组件测试与 E2E 冒烟通过。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；组件测试、编辑器 E2E、证据写入 `artifacts/review-gate/`。
    - **回滚边界**: 新面板与入口切换同批 revert，旧面板保留至验收通过。**kill-switch**: 并行调用触发配额 / 速率问题或无法等价复刻时，退回顺序调用或保留双按钮。

- [ ] **4. 首页 SWR / i18n cookie 决策与最小实现（P2）**
    - **执行范围**: 按 [首页 SWR 决策设计](../design/governance/2026-11-15-homepage-swr-i18n-cookie-decision.md) 的 3 个候选方案，用本地 + 可得线上证据（`/` 的 `set-cookie` 与 `cache-control`、首页回源 / 命中）产出决策记录并择一实施（现状 + 边缘兜底 / 条件化 `useCookie` / `/` 独立缓存键控）。
    - **非目标**: 不放宽 nitropack 2.13.6 缓存安全规则；不改 `routeRules` 时长；不改鉴权 / 会话链路。
    - **验收标准**: 决策记录落盘；所选方案有定向测试或可复跑探针；选 ②/③ 时 `/` 不再把 `i18n_redirected` 复制给所有访客；五语重定向不回退。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；选 ② / ③ 时升 V3（五语重定向与语言持久化），证据为决策文档 + 探针输出。
    - **回滚边界**: 配置 / cookie 行为按方案独立回退。**kill-switch**: 线上数据不可得或影响语言持久化时，只交付决策记录并保持现状，并在 backlog 恢复「首页 SWR 决策（阻塞于生产数据）」候选卡。

- [ ] **5. 覆盖率第十七批（P2）**
    - **执行范围**: 4 个脚本模块——`scripts/i18n/audit-duplicate-messages.mjs`（240/290）、`scripts/ai/check-governance.mjs`（233/341）、`scripts/governance/inventory-eslint-rules.mjs`（215/231）、`scripts/testing/capture-visual-reference.mjs`（175/214）；目标同源 `+0.3pp`（约 113 条）或模块级 `+15pp / ≥85%`；脚本池不可达时换入 `admin-taxonomy-page.vue`（111/284）。
    - **非目标**: 不为凑数测模板分支；不重构测试结构；不新增测试依赖。
    - **验收标准**: 干净全量跑（移 `.vitest-cache` / `.vitest-cache-coverage` + `--maxWorkers=4`）基线 / 收口，delta 落盘 `artifacts/coverage/`；定向测试通过；flaky 归因。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。
    - **回滚边界**: 测试文件与覆盖率产物独立可回滚。

- [ ] **6. 浮层守卫正则清理（P3）**
    - **执行范围**: 修复 `tests/modules/overlay-family-residual-guard.test.ts` 的 `stripNonTemplateBlocks` / `stripComments`（大小写不敏感、不可被嵌套输入绕过），或按 Code Scanning 策略登记 `used in tests` false-positive，关闭 4 条 open warning。
    - **非目标**: 不改守卫覆盖范围与组件清单；不引入 HTML sanitizer 依赖。
    - **验收标准**: 4 条告警关闭或按策略登记；守卫对 `<SCRIPT>` / 嵌套片段仍判红；定向测试通过。
    - **验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；告警前后状态与负向用例。
    - **回滚边界**: 单文件正则 / 豁免登记独立回滚。**kill-switch**: dismiss 不被安全规范 §5.3 接受且正则修复改变守卫语义时，移出阶段并登记 backlog。

> 上一阶段归档：第七十五阶段「依赖与静态规则收口、运行时基线升级与治理口径统一」已完成全部 6 条条目并归档（条目 3 已移出至 backlog），正文见 [roadmap 归档分片](./archive/roadmap-phases-75.md)、条目明细见 [待办事项归档](./todo-archive.md)、阶段结论见 [项目计划](./roadmap.md#第七十五阶段归档结论最近归档阶段)。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
