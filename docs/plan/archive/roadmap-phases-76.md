# 项目计划归档：第七十六阶段

> 本分片收录第七十六阶段「内容与编辑体验收口、首页缓存决策与质量基线」的完整规划正文与收口结论（2026-11-15 立项并收口）。

### 第七十六阶段：内容与编辑体验收口、首页缓存决策与质量基线（已审计归档）

**时间表**: 2026-11-15 ~ 待定（按里程碑滚动，不预设结束日）

**目标**: 在连续五个治理阶段之后补回用户可见的内容与编辑体验：完成设置表单最后 4 项 AI 图像回退配置、Jekyll 迁移适配器与编辑器「AI 审校」合并；同时给首页 SWR 缓存与 i18n cookie 冲突一个可执行结论，并以覆盖率第十七批与浮层守卫正则清理守住质量基线。

**准入结论**: 用户于 2026-11-15 在候选页确认「方案 A：内容与编辑体验」6 条组合。ROI（Value+Alignment / Difficulty+Risk）：设置 AI Image Fallback `1.67`、JekyllParser `1.67`、编辑器 Phase C `1.00`、首页 SWR 决策 `1.17`、覆盖率第十七批 `2.00`、浮层守卫正则 `1.33`；Phase C / SWR / 正则在 §3.3 准入线 `1.5` 以下，经用户在同一候选页明确确认后受控纳入：Phase C 为 `1.00`，命中 §3.3 第三档（≤1.0「应取消或长期搁置」），按用户明确指示「决策性纳入」（Phase A/B 已交付，仅剩合并收尾）；条目 3 / 4 保留 kill-switch，条目 6 以移出顺序 + 安全策略登记收口。会员 / 付费订阅、播客与多媒体、AI 视频仍留在 backlog。

**准入前置（已核对 2026-11-15）**: 第七十五阶段已审计归档（`todo.md` 清空、`roadmap.md` 已迁出正文、回归窗口 51 行 / 4 条）；工作区干净、`master` 与 `origin/master` 同步于 `03d9d769`，该提交 CI（Test / Docker / VitePress / CodeQL / TODO）全绿；Dependabot open 仅 deepmerge #275 low（已登记台账）；Code Scanning open 4 条 warning 均在 `tests/modules/overlay-family-residual-guard.test.ts`。阶段基线：同源 statements `83.28%`（31,441 / 37,755，未覆盖 6,314 条 / 458 文件（37,755 − 31,441））、`duplicate-code` 0.39%、`coreEntryJs` 280.87KB / 335KB、`keyCss` 59.41KB / 62KB、i18n `missing` 0 / duplicates 64 组。

**阶段容量与移出顺序**: 6 条在办（1 / 2 / 3 / 4 / 5 / 6）。条目 1 只动设置映射 / 表单 / 五语；条目 2 只动 CLI 解析器与测试；条目 3 只动编辑器前端编排与面板；条目 4 先决策后最小实现，不碰缓存安全规则；条目 5 是测试批次；条目 6 只动一个守卫测试的正则。排程上先做 1 / 2（独立、可并行），再做 5（收口需要干净基线），3 / 4 视依赖与数据到位情况插入，6 最后。若阶段超时，按 6 → 4 → 3 的顺序移出。

1. **设置表单 AI Image Fallback 4 项（P2）**: 补齐 `AI_IMAGE_FALLBACK_PROVIDER` / `API_KEY` / `MODEL` / `ENDPOINT` 的 `SETTING_ENV_MAP`、`.env.full.example` 注释示例与 `ai-settings.vue` 的表单控件（挂在 `ai_image_enabled` 组内，沿用现有 `SettingFormField` + `metadata.isLocked`）；五语翻译补齐。**非目标**: 不暴露基础设施密钥到后台；不改 `FORCED_ENV_LOCKED_KEYS` 安全锁定；不引入新 AI Provider。**验收标准**: 4 个 key 可从 env 读入并在后台编辑（锁定态只读）；保存后 `/api/ai` 的 fallback 链路读取一致；五语 key parity 0；`SETTING_ENV_MAP` 无遗漏、无重复。**验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；设置页定向测试、i18n `check-sync` / `audit:missing`、证据写入 `artifacts/review-gate/`。**回滚边界**: 类型 / 映射 / 表单 / 翻译同批 revert。

2. **JekyllParser 适配器（P2）**: 在 `packages/cli/src` 新增 `JekyllParser`（解析 Jekyll YAML front-matter），复用 `ContentParser` 接口与 `import-command` 的 `--format` 选择，并同步 `--format` 帮助文本（`hexo, hugo, wordpress, jekyll`）；补单测覆盖 title / date / tags / categories / content 与缺字段场景。**非目标**: 不支持在线 API 导入、不做自动格式检测、不做主题 / 插件迁移。**验收标准**: `--format=jekyll` 正确选择解析器；`--help` 文本含 jekyll；五字段映射正确；Hexo / Hugo / WordPress 行为无回归；CLI 包定向测试通过。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；解析器单测与 CLI 导入冒烟。**回滚边界**: 新增文件与 `import-command` 分支独立回滚。

3. **编辑器工具栏 Phase C — AI 审校合并（P2）**: 按 [editor-toolbar-consolidation-eval §2.3](../design/governance/editor-toolbar-consolidation-eval.md) 新建 `PostEditorConsolidatedReviewPanel`（「问题修正」/「视角建议」双 Tab + editor/reader 切换），前端编排 `/api/ai/review` 与 `/api/ai/perspective-check` 两次调用，替换现有两个侧面板；保留原 API 的关注点分离；必要时在 `usePostEditorAI` 补并发抑制（或按 kill-switch 退回顺序调用）。**非目标**: 不合并服务端 API；不改 MavonEditor 原生工具栏；不改编辑器布局与 AI 计费 / 配额；不新增 Provider。**验收标准**: 单按钮触发两次调用并统一展示；两 Tab 内容与旧面板等价；失败 / 部分失败有可读降级；编辑器定向组件测试与 E2E 冒烟通过。**验证矩阵 / 证据落点**: V0 + V1 + V2 + V3 + RG；组件测试、编辑器 E2E、截图或证据写入 `artifacts/review-gate/`。**回滚边界**: 新面板与入口切换同批 revert，旧面板保留至验收通过。**kill-switch**: 并行调用触发配额 / 速率问题或旧面板无法等价复刻时，退回顺序调用或保留双按钮，不硬拆 API。

4. **首页 SWR / i18n cookie 决策与最小实现（P2）**: 按 [首页 SWR 决策设计](../design/governance/2026-11-15-homepage-swr-i18n-cookie-decision.md) 的 3 个候选方案，用本地 + 可得的线上证据（`/` 的 `set-cookie` 与 `cache-control`、首页回源 / 命中）做决策记录，择一实施：① 保持现状 + 边缘缓存兜底；② 关闭或条件化 `detectBrowserLanguage.useCookie`；③ `/` 独立边缘缓存键控。**非目标**: 不放宽 nitropack 2.13.6 的缓存安全规则；不改 `routeRules` 的 swr / isr 时长；不改鉴权与会话链路。**验收标准**: 决策记录落盘（含证据与取舍）；所选方案有定向测试或可复跑探针；`/` 不再把 `i18n_redirected` 复制给所有访客（若选 ②/③）；五语重定向行为不回退。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；选 ② / ③ 时升 V3（五语重定向与语言持久化用例），证据为决策文档 + 探针输出。**回滚边界**: 配置 / cookie 行为按方案独立回退，缓存安全规则不动。**kill-switch**: 线上数据不可得或方案 ② 影响语言持久化时，只交付决策记录并保持现状；在 backlog 恢复一条「首页 SWR 决策（阻塞于生产数据）」候选卡。

5. **覆盖率第十七批（P2）**: 按绝对未覆盖语句数取 4 个脚本模块：`scripts/i18n/audit-duplicate-messages.mjs`（240 / 290）、`scripts/ai/check-governance.mjs`（233 / 341）、`scripts/governance/inventory-eslint-rules.mjs`（215 / 231）、`scripts/testing/capture-visual-reference.mjs`（175 / 214），目标同源 `+0.3pp`（约 113 条）或模块级 `+15pp / ≥85%`；若脚本池不可达，按同一口径换入 `components/admin/admin-taxonomy-page.vue`（111 / 284）。**非目标**: 不为凑数测模板分支；不重构测试结构；不新增测试依赖。**验收标准**: 干净全量跑（移 `.vitest-cache` + `.vitest-cache-coverage` + `--maxWorkers=4`）基线 / 收口，delta 落盘 `artifacts/coverage/`；定向测试通过；flaky 归因记录。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；`coverage-final.json` 副本与证据文件。**回滚边界**: 测试文件与覆盖率产物独立可回滚。

6. **浮层守卫正则清理（P3）**: 修复 `tests/modules/overlay-family-residual-guard.test.ts` 的 `stripNonTemplateBlocks` / `stripComments`，使 `<script>` / `<style>` / `<!--` 匹配大小写不敏感且不会被嵌套输入绕过（或按 Code Scanning 策略登记 `used in tests` 的 false-positive），关闭 4 条 open warning。**非目标**: 不改守卫覆盖范围与组件清单；不引入 HTML sanitizer 依赖。**验收标准**: 4 条 Code Scanning 告警关闭或按策略登记；守卫对 `<SCRIPT>` / 嵌套片段仍判红；`overlay-family-residual-guard` 定向测试通过。**验证矩阵 / 证据落点**: V0 + V1 + V2 + RG；告警前后状态与守卫负向用例。**回滚边界**: 单文件正则与豁免登记独立回滚。**kill-switch**: dismiss 不被 [安全规范 §5.3](../standards/security.md#53-发布前安全告警门禁-release-security-alert-gate) 接受且正则修复会改变守卫语义时，移出本阶段并登记 backlog。

**回滚边界（阶段级）**:

- 条目 1：设置映射 / 表单 / 翻译同批 revert。
- 条目 2：新增解析器与 `--format` 分支独立回滚。
- 条目 3：新面板与入口切换同批 revert。
- 条目 4：按所选方案独立回退，缓存安全规则不动。
- 条目 5：测试文件与覆盖率产物独立可回滚。
- 条目 6：单文件正则 / 豁免登记独立回滚。

**风险提示**: ① Phase C 并行两次 AI 调用会放大配额与延迟，必须先确认 `usePostEditorAI` 的并发抑制；② SWR 决策依赖线上数据，缺数据时不得凭本地结果改缓存策略；③ 覆盖率脚本池可能因无法构造失败路径而不可达，需按同源口径换入组件模块；④ 设置表单 `API_KEY` 必须走 `SettingPassword` 掩码，不得进入 `INTERNAL_ONLY`，也不得从非管理员接口回传；⑤ Code Scanning 若直接 dismiss，必须按安全规范登记理由，不能静默关闭。


### 第七十六阶段归档结论（最近归档阶段）

**审计结论**: 第七十六阶段六条条目全部完成并归档（2026-11-15 立项与收口）。条目 1 补齐 `AI_IMAGE_FALLBACK_*` 四项 `SETTING_ENV_MAP` / `.env.full.example` / `ai-settings.vue` 控件与五语翻译，V3 浏览器验证 2/2（含 env 锁定态与保存回显掩码）；条目 2 新增 `JekyllParser`（单数键优先、复数键空白拆分、文件名日期推导），CLI 全量 140 例、`--format=jekyll` 冒烟通过；条目 3 以 `PostEditorConsolidatedReviewPanel` 合并「问题修正 / 视角建议」双 Tab，单入口并行两 API，V3 探针 6/6；条目 4 以线上探针选定 ① 保持现状（`/` 仍 `DYNAMIC`、`/robots.txt` 为 `HIT`），②/③ 转 backlog #18；条目 5 覆盖率第十七批四脚本模块 `50→288/291`、`108→351/352`、`16→230/231`、`39→226/229`，全仓 `82.98% → 85.25%`（+887 条 / +2.27pp）；条目 6 手写剥离扫描替换单次正则，4 条 Code Scanning 告警 fixed（open=0）。各条 Review Gate 均 Pass。


阶段收口 `regression:phase-close` **Pass**：coverage `32,568 / 38,163 = 85.34%`（778 文件）、`release:check:full` 12/12（含 lint / typecheck / test 5,741 例 / E2E 286 例中 227 passed / 1 flaky retry 通过 / 58 skipped）、docs 五项、perf budget strict、duplicate 0.47%（48 clones / 811 行）、Review Gate 生成检查全 PASS；本地多次重跑中的浏览器导航 / 点击丢失已按测试规范归因为并发环境 flake（单测与 E2E 孤立复跑均通过）。

> 未覆盖边界与后续观察项：① 旧 AI 审校两个侧面板保留未删（回滚边界），验收通过后另立收口条目；② 首页缓存与语言检测解耦（②+③）登记 backlog #18；③ Jekyll `categories` 多分类按墨梅单分类模型取拆分首项；④ 覆盖率四模块剩余 8 条未覆盖语句均为入口/加载器；⑤ schema 变更与更大范围缓存改造需单独评估。
