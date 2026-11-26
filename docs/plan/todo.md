# 墨梅博客 待办事项（Todo List）

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办（Todo）
- [x] 已完成（Done）
- [-] 已取消（Cancelled）

> 进度表状态另按 [规划文档模型 v1](../standards/planning-docs.md) 的四值口径：`未开始` / `进行中` / `已闭环` / `已阻塞`。

---

## 当前进行中阶段

| 大条目 | 小条目 | 状态 | 提交 | 审计 | 容量（计划→实际） |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 86.1 质量滚动治理 | 3/4 | 进行中 | 待提交 | — | 4 → 3 commits |
| 86.2 依赖与合并治理 | 2/3 | 进行中 | 待提交 | — | 3 → 2 commits |
| 86.3 移动端收尾 | 3/3 | 已闭环 | 待提交 | — | 3 → 3 commits |
| 86.4 性能与包体 | 1/2 | 进行中 | 待提交 | — | 2 → 1 commits |

### 第八十六阶段：质量、依赖、移动与性能四线收口（进行中，2026-11-26 立项）

> 阶段规划、验收标准、kill-switch 与回滚边界见 [项目计划](./roadmap.md#第八十六阶段质量依赖移动与性能四线收口进行中)。小条目默认独立提交、独立审计；强耦合时才合并批次并写明理由。

- [ ] **86.1 质量滚动治理（P1）**
    - [x] **86.1.1 覆盖率第二十六批（P1）**
        - 目标: `packages/mcp-server/src/tools/**`（3 文件 / 0–23%）、analytics 插件（3 文件 / 8–57%）、admin 设置组件（3 文件 / 14–22%）补测至 statements ≥80%。
        - 验收: 三组模块 statements 均 ≥80%；同源 statements ≥88.4%（+0.5pp）；干净全量 `test:coverage` EXIT 0；不放宽覆盖率阈值。
        - 交付物: 测试用例、coverage 证据 `artifacts/coverage/2026-11-26-phase86-item1/`。
        - 依赖: 85 阶段基线；组件 stub 模式。
    - [x] **86.1.2 静态规则债第七批（P1）**
        - 目标: 承接 backlog 指定的下一候选 `no-unnecessary-type-conversion`（41 命中 / 26 文件），清零命中并在生产 TS 升 `error`。
        - 验收: `no-unnecessary-type-conversion` 0 命中并升 `error`，inventory 0 命中 / 0 显式豁免 / effectiveSeverity 2；无新增 error；issue #262 回写；不使用 `ts-ignore` / `any` 逃逸。
        - 交付物: 代码修正、ESLint 配置、inventory 证据、issue 回写。
        - 依赖: 86.1.1 不阻塞；规则命中复测。**Kill-switch**: 复测 >60 命中或需放宽类型 → 按目录分批（单批 ≤45 命中），保留余量并登记；`no-unsafe-assignment`（230）/ `no-unsafe-member-access`（288）继续分桶，不在本批清零。
    - [ ] **86.1.3 认证页结构复用（P2）**
        - 目标: 抽取登录 / 注册共享的认证页骨架（卡片、标题、表单字段布局），保留验证码 / 社交登录 / 记住我 / 校验差异。
        - 验收: duplicate-code ≤0.25% 且无新增 clone；登录 / 注册单测 + E2E 通过；视觉 32/32、parity 不低于 82/83。
        - 交付物: 共享组件 / 模板、单测、E2E、duplicate 证据。
        - 依赖: 85 视觉基线。**Kill-switch**: 行为分叉 >3 处时只抽卡片壳与样式，不抽表单逻辑。
    - [x] **86.1.4 非字阶字号评估与 token 化（P2）**
        - 目标: 149 条非字阶 `font-size` 分组评估（可 token 化 / 有意保留），token 化 ≥40 条。
        - 验收: token 覆盖率 ≥65%；视觉 32/32、parity 无新增失败；每组留评估依据；不按现值批量替换。
        - 交付物: 字号 inventory 前后对比、分组报告、样式改动。
        - 依赖: 字号 inventory 与视觉门禁。**Kill-switch**: parity 新增失败 >2000px 或 >2 条用例即停止该组，见 roadmap §86.1.4。

- [ ] **86.2 依赖与合并治理（P2）**
    - [x] **86.2.1 major 升级自动合并门禁（P1）**
        - 目标: 识别 major 版本升级（PR 标题 `from x.y.z to A.B.C`）并阻止自动合并，minor / patch 保持现状。
        - 验收: 检测脚本单测覆盖 major / minor / patch 与预发布版本；Mergify 条件排除 `semver-major` 标签；文档写明回滚方式。
        - 交付物: 脚本、workflow / Mergify / dependabot 配置、单测、文档。
        - 依赖: 现有 Mergify 规则与 CI 预检。**Kill-switch**: 误伤 minor/patch >1 次即回退为「仅标签告警 + 人工合并」，见 roadmap §86.2.1。
        - 上线观察: 下一个 Dependabot 周期核对 `Dependabot Major Guard` 是否出现在 PR head commit、minor/patch 是否按原节奏自动合并；检查未出现或 PR 停摆超过 1 个周期即执行 kill-switch，并在 `artifacts/review-gate/` 留痕。
    - [ ] **86.2.2 merge queue 可行性验证（P2）**
        - 目标: 在测试仓库闭环详细方案 §7 的 6 项验证，给出采用 / 不采用 / 分步结论。
        - 验收: 6 项验证逐条有结论；未验证前不修改生产 `merge_method`；结论落治理文档。
        - 交付物: 验证报告、决策结论。
        - 依赖: 用户提供的测试仓库 / 套餐权限。**Kill-switch**: 无法验证时只保留 86.2.1 与报告；queue 退回需重新登记 backlog（双轴评分 + 验证结论）。
    - [x] **86.2.3 依赖台账与安全门禁复核（P1）**
        - 目标: 复核 6 条 `dependency-risk-allowlist` 的 `reviewBy`、Dependabot open 与 major PR 状态，保持 `security:audit-deps` / `security:alerts` 可追溯。
        - 验收: 6 条豁免均在期内；两门禁通过并留证据；Dependabot / major PR 盘点写入报告；过期或未登记项判红。
        - 交付物: 审计报告、artifact。
        - 依赖: `server` 安全脚本与 GitHub alerts 访问。

- [ ] **86.3 移动端收尾（P2）**
    - [x] **86.3.1 骨架屏独立视觉基线（P2）**
        - 目标: 为列表骨架屏建立独立移动基线（组件级冻结 pending 或测试专用挂载），不向生产路由注入延迟端点。
        - 验收: 新基线在移动视觉层通过；移动视觉用例数由 26 增至 ≥27（1 个新用例 × 2 主题）；无生产路由 / 接口改动。
        - 交付物: 视觉用例、基线、证据。
        - 依赖: 85 移动视觉层；[归档批次 2026-11-26（旧 #6）](./archive/backlog-resolved-candidates.md)。
    - [x] **86.3.2 评论框与剩余公开表单移动化（P2）**
        - 目标: 评论框及剩余公开表单输入字号 ≥16px，补齐 `autocomplete` / `enterkeyhint`；提交按钮可达。
        - 验收: 定向 E2E 三浏览器通过；移动基线无回归；桌面 parity 无新增失败。
        - 交付物: 样式 / 模板改动、E2E、基线。
        - 依赖: 85 表单规则（`.public-form`）。
    - [x] **86.3.3 触控与 hover 兜底第二批（P2）**
        - 目标: 公开页第二批触控审计 ≥20 个可点击元素；至少 2 条 hover-only 交互有可见替代。
        - 验收: 审计清单落证据；不达标项修复或登记理由；2 条 E2E 覆盖。
        - 交付物: 审计 JSON / 报告、样式改动、E2E。
        - 依赖: 85 触控审计基线。

- [ ] **86.4 性能与包体（P2）**
    - [x] **86.4.1 CWV 基线采集与周期回归（P1）**
        - 目标: 对齐 `test:perf:cwv`（5 条路由：首页 / 文章详情 / 分类 / 标签 / 归档）产出 LCP / CLS / TBT 基线，并接入 weekly warning 面；移动形态与 INP 为扩展评估项，未覆盖时如实登记。
        - 验收: 基线 JSON + 报告落盘（5 路由 / LCP·CLS·TBT）；连续两次运行波动 ≤10% 或记录环境差异；`regression:weekly` 可执行；写明与第五十二阶段一次性评估的增量（CI 可复跑 + weekly 接入）。
        - 交付物: 基线、报告、workflow 接入。
        - 依赖: Lighthouse / 本地生产构建。
    - [ ] **86.4.2 包体余量评估与瘦身（P1）**
        - 目标: 评估 `keyCss` / `coreEntryJs` / `maxAsyncChunkJs` 现状与 top 贡献者，完成至少一项 ≥2KB gzip 的可归因瘦身或给出不瘦身实测依据。
        - 验收: `test:perf:budget:strict` 通过且预算文件未放宽；前后对比报告；视觉 parity 无新增失败。
        - 交付物: 包体报告、CSS / 构建改动。
        - 依赖: 生产构建产物。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)
