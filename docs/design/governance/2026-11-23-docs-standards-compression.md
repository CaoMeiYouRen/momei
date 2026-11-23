# 文档规范压缩说明（Docs & Standards Compression）

> 本文件是 [文档规范 §5.4](../../standards/documentation.md#54-规划与治理维护陷阱) 与 [规划规范](../../standards/planning.md) 本次压缩的单点理由与影响说明，按 [文档规范 §3.5](../../standards/documentation.md#35-无历史叙述原则-no-historical-narrative) 的「历史必须单点收纳」要求承接 why / what / impact。

## 1. 为什么压缩

`docs:check:line-count:candidate` 对 `docs/standards/documentation.md`（error 线 320）与 `docs/standards/planning.md`（warn 线 365）持续报超线：两份规范在演进中累积了表格化阈值、逐阶段维护教训与重复的回归记录口径，正文形态偏向「手册」而不是「规则索引」。压缩目标是让规范回到「规则 + 单点引用」形态，同时不降低任何约束强度。

## 2. 压缩了什么

| 规范位置 | 处理 | 规则落点 |
| :--- | :--- | :--- |
| `documentation.md` §5.4 陷阱表（25 行结论） | 整表迁入 [文档维护陷阱清单](./documentation-maintenance-traps.md)，§5.4 保留「先读清单」强制要求 | 新治理文档；`#54-规划与治理维护陷阱` 锚点保留 |
| `documentation.md` §5.1 五类文档行数阈值 | 改为分类单点引用（`roadmap.md` / `todo-archive.md` → `archive/index.md` §3；`README*` / `backlog.md` / `regression/current.md` → 规划规范 §4.4） | 阈值单点不变，机检仍为 `scripts/docs/check-line-count.mjs` |
| `documentation.md` §6.3 tier 表 / 源路径解析 / 运行入口表 | 三张表各合并为一句，天数、fallback 顺序与三个入口的阻断语义逐项保留 | §6.3 正文 |
| `documentation.md` §4.3.1 locale 矩阵 | 4 行矩阵改 4 条列表，tier 与页面清单逐项保留 | §4.3.1 正文 |
| `documentation.md` §5.0 / §5.3 / §2 / §3.1 / §3.5 / §4.4 / §4.5 | 合并同类项，编号重排；§3.5 禁用表达清单保持中文 7 项 / 英文 8 项（共 15 项）齐备，与 `review-checklist.md` §4.6 口径一致 | 各节正文 |
| `planning.md` §4.2 回归记录落点与输出模板 | 落点合并为 1 条，模板扁平化为可复制的 4 组字段 | §4.2 正文 |
| `planning.md` §4.5 Step 3 / Step 4 / Step 8 | 列表合并，7 项文档同步检查、5 步文件更新顺序、4 类清洁检查（含 11 个子项）全部保留 | §4.5 正文 |
| `docs/guide/translation-governance.md` §1 适用范围 | 5 条列表合并为一句 | §1 正文 |

## 3. 影响与边界

- 规则数量与阈值语义不变；差异集中在表达形态（表格 → 单句、内联 → 指针）。
- 失效面只有一类：依赖 §5.4 正文逐条阅读的读者，需改为阅读陷阱清单；锚点仍在，跨文档引用不需要改写。
- 未处理项：`docs/guide/deploy.md`（候选 warn 线 255，现 274）属指南类文档压缩，另立切片。
- en-US 镜像（`summary-sync`）本轮新增内容只保留 `last_sync` 与本说明回链，存量 Sync note 按后续批次收敛；ko-KR / zh-TW 镜像为 `source-only`，不做同步承诺。
