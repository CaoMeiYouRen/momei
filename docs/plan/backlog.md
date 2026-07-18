# 墨梅博客 长期规划与积压项 (Backlog)

本文档用于维护尚未进入正式阶段执行面的统一候选池，并按“长期主线任务”与“短期 / 一次性候选任务”双轨区分。当前阶段执行面请参阅 [项目计划](./roadmap.md)、[待办事项](./todo.md) 与 [待办归档](./todo-archive.md)。

> **维护规则**:
> 1. 新功能需求、非阻塞优化与长期治理事项优先写入本文件，而不是直接写入 `todo.md`。
> 2. backlog 必须区分"长期主线任务""周期性回归验证层"和"短期 / 一次性候选任务"：长期主线可跨阶段保留，回归验证层有固定节奏不参与阶段排队，短期 / 一次性候选在正式上收后必须去重。
> 3. 长期主线被某阶段抽取后，不删除主线卡片，只补记最近一次上收阶段、当前状态与下一次可切片方向。
> 4. 周期性回归验证层不是"一个任务"，而是所有长期主线的健康检查层。它按固定日历节奏执行（周级/发版前/阶段收口），不参与阶段切片容量竞争。回归发现的问题回灌到对应长期主线。
> 5. 当前仓库的 backlog 以中文为唯一事实源；翻译文档只保留摘要或跳转说明。

## 长期主线任务（可跨阶段保留）

> 状态口径统一使用：进行中 / 观察中 / 暂停 / 已关闭。
> 共 11 条（2026-05-19 增补脚本治理主线，2026-06-03 增补站点性能主线）：原 12 条长期主线中，4 条文档类任务已合并为 1 条，周期性回归已提级为独立验证层；本轮新增 1 条“脚本资产、量化口径与回归入口治理”主线，用于承接长期治理的 script-first 基座。

1. **测试覆盖率与有效性治理**
- **目标**:
    - 在全仓 coverage 已越过 `80%+` 后，继续把重点转向高风险链路的红绿测试有效性与回归价值，而不是只把覆盖率数字继续当作唯一目标。
    - 优先围绕前端直连 TTS、AI task 计量口径、认证退化与公开热点读链路补失败断言、边界断言与统计一致性验证。
- **状态**:
    - 进行中。
- **当前状态**:
    - 第二十六阶段已将全仓覆盖率推进到约 `72%`，第二十八阶段也已完成本轮切片并把全仓 coverage 推进到 `76%+`。
    - 第三十一阶段已继续围绕共享文案 raw key 暴露、认证配置退化与 coverage blocker 三条高风险链路补齐失败断言，并把 `AppFooter` 与公开友链页纳入固定 runtime 回归入口；当前全仓 coverage 已稳定在 statements `76.03%` / lines `76.08%`。
    - 第三十二阶段已正式上收切片，沿公开页 runtime / auth 配置退化 / 认证页 raw key 暴露方向补多轮高价值断言，全仓覆盖率持续抬升但尚未达到 `80%+` 冲刺目标。
    - 第三十四阶段已正式完成 `80%+` 收口，当前全仓 coverage 为 statements `80.03%` / lines `80.05%`；下一轮重点从"继续冲数字"转为"围绕前端直连 TTS / AI task 计量口径 / 高风险运行时链路做防回归与统计一致性治理"。
    - 长期主线仍未结束，后续目标继续朝 `80%+` 推进，但下一轮仍应优先选择已有测试基座且回归风险高的模块，而不是回到低价值铺量测试。
- **最近一次上收阶段**:
    - 第三十七阶段（已正式上收高风险测试有效性切片，聚焦前端直连 TTS / AI task 口径一致性 / 认证退化 / 公开热点读链路）。
    - 第四十四阶段（已上收友链 RSS 聚合测试回填切片）。
    - 第四十六阶段（已上收 A/B/C/D 四组高风险补测切片，全仓 coverage 82%+ 收口）。
    - 第四十九阶段（已补齐 Phase C feed 渲染/降级测试，关闭 Phase 44 剩余缺口）。
    - 第五十五阶段（已上收测试有效性第三轮切片：7 个新增失败路径断言，覆盖 AI 编辑器、friend-links、admin settings 三个模块）。
- **下一次可切片方向**:
    - 若后续继续上收，优先进入“测试有效性第二轮切片”：补组件层 direct TTS 失败映射、页面级 auth degradation，以及 `settings public` 或 `friend-links` 的失败口径，避免高风险链路只剩服务端成功断言。
    - 保持“已有测试基座 + 失败 / 边界优先”的节奏，不回到低价值 coverage 铺量。

2. **ESLint / 类型债与规则收紧治理**
- **目标**:
    - 按批次继续收紧 ESLint 规则，至少再收紧``1 -`` 条高 ROI 规则，减少豁免、漂移写法与隐性债务，而不是一次性大爆炸式收口。
    - 治理进度默认以可重复执行的规则债盘点脚本作为事实源，至少能按 rule / 目录 / 豁免类型统计命中数、清零数与残余债务，而不是只靠阶段叙述判断“似乎有进展”。
- **状态**:
    - 进行中。
- **当前状态**:
    - 第二十四阶段已完成 `@typescript-eslint/no-dynamic-delete` 首轮生产代码收紧，warning 基线、回滚方式与最小验证矩阵已落盘。
    - 第二十九阶段已完成新的规则收紧切片，当前已补齐 `mcp-server` 与 settings API 两组窄边界规则上收、命中清单、回滚边界与最小验证矩阵；后续仍不直接扩写到 `no-unsafe-*` 或全仓 `any` 清零工程。
    - 第三十阶段已完成两轮 `@typescript-eslint/no-explicit-any` 收紧，当前已清零 `utils/shared/markdown.ts` 中 `7` 处显式 `any`，以及 `server/utils/object.ts`、`server/utils/pagination.ts` 中 `2` 处显式 `any`；同时已完成 `@typescript-eslint/no-non-null-assertion` 在 `server / composables / 前端表单` 三桶采样。
    - 第三十一阶段已继续把 `@typescript-eslint/no-non-null-assertion` 缩到 `composables` 子桶，当前生产源码命中已收敛到 `composables/use-post-editor-io.ts` 单文件 `8` 处，并通过显式守卫、局部变量与类型收窄完成清理；目录级``pnpm exec eslint composables --max-warnings`` 已恢复通过。
    - 第三十二阶段已完成"单规则窄切片 + 同规则归组 + 定向验证 + 残余债务说明"四条件收口，`@typescript-eslint/no-explicit-any` 在 `composables/use-post-editor-voice.ts`（9 处）与 `server/api/categories/index.get.ts`（1 处）已完成收敛；同规则配置已归并为单一 override。
    - 第三十三阶段已正式上收下一轮切片，继续锁定 `@typescript-eslint/no-non-null-assertion` 在 `composables/` 子桶，并允许回退到单文件 `no-explicit-any` 切片。
    - 当前仍缺少统一的规则债 inventory 脚本；现有 `lint`、定向 `eslint` 与阶段记录可以证明单次切片通过，但还不能稳定回答“全仓还剩多少命中、按目录如何分桶、每轮实际消掉了多少”。
- **最近一次上收阶段**:
    - 第三十七阶段（已正式上收 `server/services/ai/asr.ts` 为优先窄切片候选）。
    - 第四十一阶段（四组窄切片，26 文件 warning=0）。
    - 第四十二阶段（三组 no-explicit-any 窄切片，治理范围 26→36 文件）。
    - 第四十三阶段（三组窄切片：require-explicit-emits + no-required-prop-with-default + max-lines + no-non-null-assertion 扩展）。
    - 第四十四阶段（三组窄切片：no-non-null-assertion + no-explicit-any + server/services 全清零）。
    - 第四十五阶段（两轮窄切片：require-await + no-explicit-any 子桶收敛）。
    - 第四十六阶段（至少三组窄切片，实际完成 4 组：app.vue + 3 个 settings 组件 `defineModel<any>` 收敛）。
    - 第四十七阶段（6 处生产代码 as any 收敛，eslint-disable 维持 ≤13）。
    - 第四十八阶段（9 处 as any 清零：seed-demo.ts + translation.ts + typeorm-adapter.ts）。
    - 第五十一阶段（≥5 组窄切片，11 处 as any → 具体类型断言收敛，typecheck 零错误）。
    - 第五十五阶段（3 组窄切片：social-post-platforms 非空断言 + nuxt.config.ts explicit-any + admin-taxonomy-page 13 处 any，累计消除 22 处；同步更新 eslint-debt-targets.mjs）。
- **下一次可切片方向**:
    - 下一轮进入实现前，先补一条规则债 inventory 脚本，至少覆盖 `no-explicit-any`、`no-non-null-assertion`、warning 基线与目录分桶；正式切片默认以该脚本输出作为 baseline / delta 事实源。
    - 继续坚持“单规则 + 单文件 / 双文件”窄切片，优先在未覆盖的生产文件中推进。
    - 进入实现前仍需冻结命中清单、回滚边界与最小验证矩阵。

3. **结构复用治理：重复代码、零散类型与纯函数 / 工具函数收敛**
- **目标**:
    - 继续压缩高频重复实现，补齐共享 helper / 纯函数抽象，并把零散类型、简单工具函数与轻量响应壳层纳入受控复用范围，降低后续变更的维护成本与行为漂移风险。
    - 优先治理逻辑简单、跨文件重复率高、适合稳定上收到共享层的类型与工具函数，而不是把所有局部实现都强行抽象。
    - 对 `jscpd` 覆盖不到的“简单内部函数 / type / interface 重复”建立脚本盘点口径，优先统计同名、近似名与同形状声明候选，再逐个判断是否真的值得复用。
- **状态**:
    - 进行中。
- **当前状态**:
    - 第二十四阶段已完成两轮小切片治理，重复代码基线已收敛到 `34 clones / 879 duplicated lines / 0.79%`。
    - 第二十九阶段已完成新的复用收敛切片，当前已收敛共享 CSV 列表解析、前台 legal pages 与公共页模板片段等高收益重复区；剩余热点继续聚焦 categories / tags 公共页及读模型组装边界。
    - 第三十阶段已正式上收下一轮复用治理切片，当前优先聚焦公共页模板片段、列表型查询 helper、查询参数归一化与读模型组装边界，并要求每组切片先写清拟抽象边界、收益与回滚方式。
    - 第三十二阶段已完成当前组合切片：`privacy-policy` / `user-agreement` 的公共 legal 页面模板与取数逻辑已收敛到共享组件 / composable，`categories` / `tags` 公开列表端点的 cache key、通用过滤与排序逻辑已收敛到 `server/utils/taxonomy-public-list.ts`；当前 `pnpm duplicate-code:check` 基线为 `32 clones / 697 duplicated lines / 0.59%`，较此前 `34 clones / 879 duplicated lines / 0.79%` 继续下降。
    - 本轮收口后，剩余高优先级热点继续聚焦 `pages/categories/[slug].vue` vs `pages/tags/[slug].vue`、公开认证相关页模板（如 `forgot-password` / `reset-password`），以及首页 / 公开列表读模型装配边界；长期主线继续保留，但当前阶段这条正式待办已可关闭。
    - 第三十三阶段已正式上收认证页模板收敛切片，聚焦 `forgot-password.vue` vs `reset-password.vue` 的公共模板片段与表单逻辑。本轮次同时追加两轮额外切片：提取 `components/taxonomy-post-page.vue` 统一 `categories/[slug]` 与 `tags/[slug]` 页面；提取 `styles/voice-popover.scss` 共享 SCSS 收敛两个 voice-overlay 组件。
    - 当前 `pnpm duplicate-code:check` 基线为 `31 clones / 575 duplicated lines / 0.48%`，较 Phase 32 收口时的 `32 clones / 697 lines / 0.59%` 继续下降（-1 clone, -122 dup lines, ↓0.11%）。
    - 当前 `check-duplicate-code` 仍主要基于 `jscpd` 行级重复，尚不能稳定覆盖"重复导入 + 轻包装""局部类型同形状复制"与 `isPlainRecord` / `isRecord` 这类简单纯函数 / 工具函数的结构性重复；下一轮已正式扩充治理口径，要求在保留现有基线的同时补做零散类型与简单工具函数盘点。
    - 当前缺少专门面向“未 export 的简单函数 / type / interface”重复盘点脚本，尚不能量化同名或近似名候选的规模，也无法稳定回答哪些候选已经人工判定为“可复用”或“保留局部实现”。
- **最近一次上收阶段**:
    - 第三十七阶段（已正式上收至少 3 处热点复用切片，优先处理 admin 列表页、自重复邮件服务与商业链接管理器）。
    - 第三十八阶段（admin 列表页结构复用）。
    - 第三十九阶段（结构复用第三轮）。
    - 第四十一阶段（2 组热点切片：SettingFieldMetadata + AgreementFormData 收敛）。
    - 第四十二阶段（三组热点切片：jscpd clones 40→37，duplication 0.69%→0.63%）。
    - 第四十三阶段（commercial-link-manager 自重复提取 + PostNavigationItem/DirectUploadStrategy/toErrorMessage 收敛，同名类型 24→20）。
    - 第四十四阶段（两组热点切片）。
    - 第四十五阶段（categories/tags 公共模板统一 + tts-http-shared 抽取）。
    - 第四十六阶段（Umami 配置 + 邮件模板 payload + Volcengine 协议头三组收敛）。
    - 第四十七阶段（FeedItem + TitleSuggestionOverlayRef 两组收敛，同名 type 17→14）。
    - 第四十八阶段（DemoTourStage/AdminAiPageEvent/VolcengineResponsePacket 三组类型统一，同名 type 15→12）。
    - 第四十九阶段（type 收敛 12→11，AdAdapterConfig 统一）。
    - 第五十一阶段（≥5 组热点切片：commercial-link-manager 参数化 + UploadType/ApiResponse 统一事实源 + use-voice-input 删除 + formatDate 复用，同名 type/interface 候选 11→10）。
    - 第五十五阶段（2 组逻辑重复抽象收敛：taxonomy-post-count.ts 子查询构建器抽取 + post-distribution-wechatsync.ts 泛型 mergeByKey；duplicate-code 0.33% < 基线 1.22%）。
- **下一次可切片方向**:
    - 下一轮优先进入 CLI 包与主项目的类型收敛：`MomeiPostStatus` → 从 `PostStatus` 枚举派生、`MomeiPostScaffoldMetadata` → 直接 import。
    - 其余候选优先从剩余轻量 shared helper 中选择，要求 `duplicate-code` baseline 不反弹。
    - 结构性重复候选继续保留：轻量壳层类型、重复导入后再轻包装的纯函数 / helper。

4. **存量代码注释治理与注释漂移收敛**
- **目标**:
    - 按现行注释规范为存量代码逐步补充高价值注释，优先覆盖复杂逻辑、兼容性兜底、跨层契约、关键副作用与核心导出函数，而不是做全仓平均铺开式补注释。
    - 同步清理失效、误导性或逐行复述代码的低价值注释，避免"注释数量增加但可维护性没有提升"。
    - 让注释治理与 Review Gate 形成闭环：每轮切片都保留受影响范围、已补注释类型、未覆盖边界与注释漂移检查结论。
    - 注释治理默认以脚本化盘点输出作为事实源，至少回答“高复杂度导出函数缺注释数、疑似逐行复述注释数、漂移注释候选数”的变化，而不是只写本轮补了哪些注释。
- **状态**:
    - 进行中。
- **当前状态**:
    - 新注释规范已经写入开发规范与 Audit 口径，下一轮可正式启动首轮存量补注释切片。
    - 现阶段更适合优先覆盖设置读取 / 来源判定、locale 归一化、鉴权上下文挂载、上传存储解析、文章访问控制、AI 配额 / 文本服务，以及数据库查询收敛逻辑等高复杂度链路，而不是回头给低风险展示组件平均补注释。
    - 编辑器链路的下一轮切片可以优先围绕 `mavon-editor` 工具栏与背景栏配色、Markdown 能力补齐，以及与文章页渲染能力保持一致的扩展项收口，而不是直接切换底层编辑器实现。
    - 第三十阶段已正式上收首轮注释治理切片，当前明确要求只选``1 -`` 组高复杂度链路推进，并同步清理失效 / 低价值注释，避免把注释治理做成全仓平均铺量工程。
    - 第三十三阶段已正式上收候选组 B 切片，聚焦 `server/services/upload.ts` 与 `server/utils/post-access.ts` 两条运行时安全敏感链路。
    - 当前仍缺少注释盘点脚本，尚不能稳定量化“复杂逻辑缺注释”和“低价值 / 漂移注释”候选规模，导致阶段叙述很难形成跨轮次可比较的进度口径。
- **最近一次上收阶段**:
    - 第三十阶段（首轮注释治理切片，已审计归档）。
    - 第三十三阶段（候选组 B 切片：`server/services/upload.ts` + `server/utils/post-access.ts`）。
    - 第三十五阶段（候选组 A 切片）。
    - 第三十九阶段（注释治理首轮：`server/services/ai/text.ts` 等）。
- **状态**: 观察中（注释盘点脚本仍未补齐，暂不建议继续扩写新切片）。
- **下一次可切片方向**:
    - 首个切片前先补注释盘点脚本。候选组 A/B/C 方向不变，首轮上收时最多选 1 组。

5. **Postgres 查询、CPU 与连接生命周期平衡治理**
- **目标**:
    - 在保证公开页面、鉴权与安装体验不回退的前提下，重新平衡 PostgreSQL 查询体量、CPU 使用与连接生命周期，减少不必要的数据库唤醒与长期活跃连接。
    - 建立"哪些请求不该碰数据库 -> 必须查库请求如何继续瘦身 -> `pg_stat_statements` 或等价 live sample 复核"的闭环，不再只用数据库出网流量作为单一目标。
- **状态**:
    - 进行中。
- **当前状态**:
    - 历史专项已完成公开设置链路与定时任务扫描的首轮治理，并验证过 `setting` 读取与定时发布扫描的结果集体量已下降。
    - 第二十八阶段已完成新的平衡型治理切片，重点收紧了请求级数据库预热、匿名鉴权触发面与公开热点读路径缓存边界；结合后台最新运行期观测，本轮查询、重复读取与连接活跃窗口下降趋势已成立。
    - 第三十二阶段已完成本轮"公开热点读链路"单路径切片：`/api/search` 匿名请求接入 `60s` 运行时缓存，带会话请求继续旁路共享缓存，当前阶段只对这一条公共热读路径做实现与断言闭环。
    - 2026-05-01 Neon live sample 显示，当前 Top SQL 中 `settings/public` 维持单次 batched `IN (...)` 读取（`5.8ms / 5.4ms`）、精选友链维持 `4.3ms / 4.1ms` 的 `DISTINCT + IN (...)` 跟进查询，`/api/search` 未继续停留在当前热点 SQL 顶部；剩余较重样本集中在 `AITask` stale scan 与首页 posts public list 查询对，转入后续候选。
    - 同日后续单路径派生切片已优先选择 `AITask` stale compensation 路径：`scanAndCompensateTimedOutMediaTasks()` 首轮扫描已收紧为最小字段集，首页 posts public list 的 `DISTINCT + IN (...)` 查询对继续保留为下一候选，待后续 live sample 复核。
    - 2026-05-14 Neon 长窗口样本已完成第三十七阶段 P1 关闭复核：最重热点仍是冷启动 TypeORM metadata introspection，System Operations 在 `5` 分钟 autosuspend 延迟下全天保持成功的 `start / suspend` 交替，说明当前已不再存在"连接长期不释放"的阻塞级现象；第三十七阶段落地的 Cron 默认门禁收紧与请求入口 connection-only 初始化已完成收口，剩余候选继续回到 backlog 管理。
    - 2026-05-18 新增预算事实：免费额度在约 `17` 天内已消耗 `5GB` network transfer 与 `90 CU-hrs`，折算约 `301MB/天` 与 `5.29 CU-hrs/天`；相较约 `170MB/天` 的安全网络预算已明显超线，说明下一轮应优先复核公开热点读链路，而不是重新并行扩写初始化治理。
- **最近一次上收阶段**:
    - 第三十七阶段（已正式上收长窗口样本复核切片，确认连接阻塞问题已消失）。
    - 第四十一阶段（TypeORM 前置清障 + Postgres archive 查询字段裁剪）。
    - 第四十九阶段（Postgres 流量治理：89% 耗尽警戒 → 减列 + 缓存 + 移除 author 冗余字段）。
- **2026-06-23 新证据**:
    - 跨 Vercel 函数日志 + Neon 操作日志联合分析发现：Postgres compute 频繁启停（~40 次/天）的根本原因不是 SQL 查询本身，而是 **Vercel 100% Cache MISS + 76% Bot 流量 → 持续触发 SSR 冷启动 → 每次冷启动唤醒 Neon compute**。
    - 每条 bot 请求穿透完整 SSR 流水线（Cron 检查 ~250ms → DB 连接 ~400-1200ms → SSR 渲染），函数平均耗时 3.25s。Neon 5 分钟 autosuspend 在 bot 2-4 分钟间隔下形同虚设。
    - 治理文档：[Vercel 缓存穿透与 Bot 流量治理](../design/governance/vercel-cache-bot-governance.md)
- **下一次可切片方向**:
    - **优先：Vercel CDN 缓存 + Nitro ISR/SWR**（堵源头，阻断 Bot → SSR → DB 的连锁反应）。具体方案分三层：Tier 1 止血（vercel.json headers + Crawl-Delay + robots.txt 缓存，~45min），Tier 2 架构（nuxt.config.ts routeRules ISR/SWR + SSG 预渲染，~3.5h），Tier 3 深度（Bot 分级缓存 + Vercel KV，评估中）。
    - **其次：继续 SQL 瘦身**（基于 Phase 49 效果，在缓存层部署后重新评估网络传输配额消耗速度）。
    - 候选组 A（`initializeDB()` 调用点审计）：仅在新增证据指向请求入口误触完整初始化时回退到此组。


6. **国际化运行时加载与文案复用治理**
- **目标**:
    - 建立“翻译字段定义 -> locale 模块注册 -> 路由动态加载 -> 运行时命中 -> 回退 / raw key 暴露 -> 文案重复键审计（i18n:audit:duplicates）”的周期性治理闭环，避免问题只在 `lint:i18n` 通过后于运行时才暴露。
    - 审慎推进跨页面相同组件文案的复用治理；只有在组件职责、文案语义和 locale 模块归属都稳定一致时，才允许上收到共享命名空间，避免为了去重而引入新的运行时加载漂移。
    - 明确将 `pnpm i18n:audit:duplicates`（国际化文案重复键审计）纳入治理必需脚本，要求与 `i18n:audit:missing`、`i18n:verify:runtime` 同步定期执行，并保留执行证据。
- **状态**:
    - 进行中。
- **当前状态**:
    - 仓库已具备 Locale Registry、按路由动态加载 message module、后台 locale 拆分、`lint:i18n` 质量门与 `i18n:audit:missing`、`i18n:verify:runtime`、`i18n:audit:duplicates` 等脚本，但近期运行时问题说明“翻译资源已存在”并不等于“当前页面一定能加载并命中正确命名空间或无重复键”。
    - 最新案例暴露出文章编辑页复用了设置页 key，导致 `/admin/posts` 路由未加载 `admin-settings` 模块时直接显示 raw key；这类问题的根因在于模块归属与组件复用边界不清，而不只是某个语言包缺词。
    - 2026-04-18 新增证据表明，`en-US/admin-posts.json` 曾长期存在大面积 parity 缺口，导致 `pages.admin.posts.media.audio_missing` 之类低级 raw key 直接漏到后台 UI。当前已补齐该模块英文词条，并把 `i18n:audit:missing`、`i18n:audit:duplicates` 接入 release / 周级回归入口，但仓库级历史缺词债与重复键债仍需专项治理，不能把本轮修补视为问题已根除。
    - 当前治理优先级明确区分三类审计结果：`missing` 缺失字段必须优先修复；`duplicates` 重复键必须及时清理；`unused` 默认先观察，但若当前切片已经定位到一批有限集合动态 key 误报或确认废弃字段，则应优先在同一切片内完成显式化或删除，避免审计噪音长期堆积。
    - 当前仍有一批“不同页面文案完全一致”的组件存在潜在复用空间，但是否上收为共享 key，必须先区分它是页面私有语义、模块级共享语义，还是可以稳定沉淀到 `common` / 组件级命名空间的真正公共文案。
    - 第二十八阶段已完成运行时治理首轮切片；第二十九阶段已完成下一轮治理切片，当前已明确 missing blocker 分级、duplicates/unused 字段排查策略与共享命名空间继续收敛方向。
    - 第三十阶段切片已完成正式收口：`i18n:audit:missing`、`i18n:audit:duplicates` 当前``total:``，`i18n:verify:runtime` 与 `components/public/admin-friend-links` 定向 parity 已通过，并已把友链公开页 / 后台页共享字段标签统一上收到 `components.friend_links.fields`。
    - 第三十一阶段已完成当前治理切片归档：固定运行时回归入口已扩到 About 公开页装配链路，并将友链公开页 / 后台页共享字段场景并入 `i18n:verify:runtime`；同时已把友链后台页、通知设置页中的有限集合动态 key 改为显式静态引用，删除 `settings` 模块一组确认废弃的浏览器通知字段，当前 `i18n:audit:missing`、`i18n:audit:duplicates` 与 `i18n:audit:unused` 均为``total:``。
- **最近一次上收阶段**:
    - 第三十一阶段（当前切片已收口，长期主线继续保留）。
    - 第四十三阶段（i18n 运行时验证扩面：app-footer/archives/categories/tags 四组链路纳入 runtime 回归 + duplicates 102→97 组收敛）。
    - 第五十阶段（i18n 首屏翻译稳定性治理：17 路由命中矩阵 + 3 处 raw key 泄漏修复 + `enahnced_pack` 模块定义补齐）。
- **下一次可切片方向**:
    - 若后续继续上收，优先选择尚未纳入 runtime 回归的公开页装配链路（如档案/分类/标签列表页的 i18n 完整性审计）。
    - 对仍需动态拼接 key 的场景，优先评估“是否为有限集合”，默认用显式静态 key 映射替代扩充 allowlist。

7. **文档事实源、翻译与分层归档治理**
- **合并来源**: 本条由原 backlog 长期主线 #7（模块设计与专项治理文档收敛）、#9（路线图 / Todo 深度归档治理）、#11（文档翻译 freshness 清偿与翻译治理）三条同类任务合并而成。原三条任务分别治理 `docs/design/`、`docs/plan/` 与 `docs/i18n/*/` 三个文档域，但治理动作本质相同：维护分层结构、设置膨胀阈值、定期清理漂移、保持 freshness。
- **目标**:
    - 统一维护项目全文档体系的分层边界、膨胀阈值与 freshness 治理：包括 `docs/design/` 的模块 vs 专项分层、`docs/plan/` 的行数阈值触发归档、`docs/i18n/*/` 的翻译 tier 分层与同步。
    - 清理无效、过时或漂移的设计 / 治理 / 规划文档，对已失效且无参考价值的内容允许直接归档或删除。
    - 保持 `docs:check:source-of-truth` 与 `docs:check:line-count` 可通过状态，不靠临时补 `last_sync` 应付检查。
    - 文档治理默认以脚本输出为准；当行数阈值或翻译 freshness 被证明过宽时，必须先回写到 `docs:check:line-count` / `docs:check:source-of-truth` 对应脚本，再更新规范与阶段结论。
- **状态**:
    - 观察中（合并后首次综合评估）。
- **当前状态（按原域追踪）**:
    - **design 域**（原 #7）：第二十九阶段已完成 `docs/design/modules/` 与 `docs/design/governance/` 的物理拆分；当前剩余工作从"继续混放目录"转为"持续清理漂移内容与残留任务口吻"，避免新文档回流到错误目录。
    - **plan 域**（原 #9）：第三十一阶段已完成首轮深度归档收口：`roadmap.md` 主窗口已回到健康范围，`todo-archive.md` 已改为"深度归档索引 + 近线阶段窗口"的维护模式。后续治理重点转为按阈值滚动归档。
    - **翻译域**（原 #11）：第三十阶段已完成翻译 freshness 首轮清偿与 tier 化治理收口；当前 `docs:check:source-of-truth` 已恢复通过，深层 design / guide / standards 页按规则降级到 `source-only` 或摘要同步口径。
    - 当前 `docs:check:line-count` 仍只覆盖 README、plan 主文档与 `docs/reports/regression/current.md`；`docs:check:source-of-truth` 的``must-sync 30 天 / summary-sync 45`` 对高频治理页仍偏宽松，尚未覆盖更多高频 Guide / Standards 文档的膨胀与 freshness 风险。
- **最近一次上收阶段**:
    - 第三十一阶段（原 #9 首轮深度归档收口：roadmap 主窗口回到健康范围，todo-archive 改为近线窗口模式）。
    - 第四十阶段（文档证据自动回填 + 发布前 pre-check 统一化）。
    - 第四十一阶段（文档门禁 warning 压缩）。
    - 第四十五阶段（文档治理收口：governance/ 19 份历史文档归档 + performance.md 分层 + backlog.md Blogroll 条目清理）。
    - 第五十阶段（backlog 深度清理：Phase 32-41 路线图 386→19 行简表 + #3/#4/#5/#8 移除 + 条目重新编号）。
- **下一次可切片方向**:
    - design 域：审计 governance/ 目录中已过期评估/报告的归档状态。
    - plan 域：按阈值触发滚动归档，跟进 `roadmap.md` / `todo-archive.md` 当前行数。
    - 翻译域：评估 `must-sync` 收紧到 21 天、`summary-sync` 收紧到 30 天的可执行性。

8. **Windows 本地 Dev / Build 性能治理**
- **目标**:
    - 为 Windows 本地 `nuxt dev` / `nuxt build` 建立统一量化口径，避免继续以"体感慢"描述问题。
    - 优先收敛首请求阻塞与构建尾耗时两类高收益热点，不把范围扩写为全平台构建重构。
- **状态**:
    - 暂停（Phase 43 确认平台级瓶颈：Linux CI 106s vs Windows >1800s，>17x 差距，非项目层面短期可收敛）。
- **当前状态**:
    - 当前已经完成一轮 Windows 定向止血：`nuxt.config.ts` 已收窄 Nitro inline 依赖、关闭 Windows 下 Nitro trace，并在 Windows 本地默认关闭 PWA；`pnpm build` 已恢复可完成。
    - 2026-05-11 已通过 [scripts/perf/measure-nuxt-lifecycle.mjs](../../scripts/perf/measure-nuxt-lifecycle.mjs) 采集到第一轮基线：`pnpm perf:nuxt:dev` 中首页 `Local` 约 `8.09s`，但 `/` 首请求 `60s` 内未拿到响应头；`--request-path=/api/settings/public` 同样 `60s` 超时，说明问题落在请求级全局冷路径而不是单页模板。
    - 同日 `pnpm perf:nuxt:build` 基线显示总耗时约 `542.77s`，`Client built` 约 `26.36s`、`Server built` 约 `28.01s`，`Server built` 里程碑出现在约 `121.14s`，之后仍有约 `421.63s` 长尾；主要压力已从 Vite bundling 转移到 Nitro / `.output/server` 收尾阶段。
    - 代码排查表明 [server/middleware/0-installation.ts](../../server/middleware/0-installation.ts) 在安装状态缓存为空时会同步 `initializeDB()`，而 [server/middleware/0b-db-ready.ts](../../server/middleware/0b-db-ready.ts) 又明确跳过 `/` 与 `/api/settings/public`，这与"所有首请求都卡住"的实测现象一致。
    - 2026-05-11 本轮规划补充了两级目标：先把 Windows 本地 build 总耗时中位数压进 `500s` 内，再在热点拆解完成后继续向 Linux 侧约 `120s` 的参考体验逼近；当前 `120s` 仍只作为对照目标，不视为已验证承诺。
    - 2026-05-23 最新 `npm run dev` 实测显示，依赖重优化后 `Nuxt Nitro server built in 372904ms`（约 `6m13s`），说明构建长尾仍然显著；本轮应把“`Server built -> Build complete` / Nitro 构建尾段”重新列为优先复核对象。
    - 同一轮实测中，首页与设置链路进入请求阶段后仍出现明显延迟：`[momei-perf] installation-probe` 于 `22:01:47` 进入 `/`，`22:02:02` 才进入 `/api/settings/public`，随后触发 `SELECT version()`、`CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"` 与 metadata 探测序列；说明冷启动数据库初始化与请求首跳仍需持续压缩。
- **最近一次上收阶段**:
    - 第三十七阶段（已正式上收 Windows 本地 Dev / Build 性能治理切片）。
    - 第四十三阶段（Vite warmup + resolve.extensions + Nitro inline 瘦身 + sourceMap + build:done 跳过，确认平台级瓶颈并上收关闭）。
- **下一次可切片方向**:
    - 暂停。仅在 Nuxt/Nitro 发布针对 Windows 的重大性能改进，或项目迁移到 WSL2/Linux 开发环境时重新评估。
    - 所有历史数据继续保留在 [docs/design/governance/windows-dev-build-performance-governance.md](../design/governance/windows-dev-build-performance-governance.md)。

9. **站点性能与 Core Web Vitals 持续优化**
- **与 #8 的区别**: #8 聚焦 Windows 本地 Dev / Build 性能（开发体验），本条聚焦**生产环境用户体验性能**（Lighthouse / LCP / CLS / INP）。
- **目标**:
    - 持续追踪核心页面的 Core Web Vitals，建立跨版本性能回归基线，并在竞品对标（Ghost 0.8s LCP、Astro 零 JS 输出）中保持优势。
    - 优先级：公开首页 > 文章详情页 > 分类/标签列表 > 后台管理页。
- **状态**:
    - 进行中（已有 Lighthouse CI + bundle budget 体系，但尚未形成持续优化节奏）。
- **当前状态**:
    - 已有 `test:perf:budget:strict` 与 `lighthouse` 配置，并在发版前 / 阶段收口入口中作为 blocker 运行。
    - 当前 `maxAsyncChunkJs` 为 `53.09KB / 120KB`、`keyCss` 为 `59.98KB / 70KB`，核心预算仍在守线范围内。
    - 竞品对标：Ghost 自托管站点通常 LCP 在 0.8s-1.5s，Astro 内容站点 LCP 可低至 0.5s；墨梅的目标应在 1.5s 以内（公共页）和 2.5s 以内（后台页）。
- **最近一次上收阶段**:
    - 第二十七阶段（首屏优化第一阶段 Lighthouse >= 50，已审计归档）。
    - 第四十二阶段（CWV 基线建设：Lighthouse CI 脚本 + 封面图懒加载 + PrimeVue 配置清理）。
    - 第四十四阶段（CWV 优化：Logo 预加载 + CSS @import 扁平化）。
- **下一次可切片方向**:
    - 评估文章详情页的按需 hydration 策略，减少首屏 JS 体积。
    - 若移动端 LCP 超过 3s，启动专项移动端性能治理。
    - 所有切片继续复用 `test:perf:budget` 与 Lighthouse CI artifact 作为事实源。
 
10. **脚本资产、量化口径与回归入口治理**
- **目标**:
    - 把脚本作为长期治理主线的事实源，优先为 ESLint / 类型债、结构复用、注释治理、文档治理等建立可重复执行的计数、分桶与 delta 输出，而不是长期依赖叙述性阶段总结。
    - 治理 `scripts/**` 目录的长期脚本入口、孤儿脚本、临时脚本残留与输出漂移，避免“脚本存在但没人跑”或“治理口径停留在文档、没有落到脚本”。
    - 让脚本治理进入固定回归入口：一旦某类治理脚本稳定，应优先并入 `regression:weekly`，再视风险升级到发版前和阶段收口入口。
- **专项设计事实源**:
    - 统一收敛到 [docs/design/governance/script-governance.md](../design/governance/script-governance.md)，后续新增脚本、接入顺序与非目标优先在该文档维护，再回写规划摘要。
- **状态**:
    - 进行中。
- **当前状态**:
    - `pnpm governance:check:scripts` 已作为 5.1 脚本资产自检稳定运行，并进入 `pnpm regression:weekly` 的 warning 基线。
    - `pnpm governance:audit:simple-duplicates`、`pnpm governance:audit:eslint-debt`、`pnpm governance:audit:comment-drift` 已分别为结构复用、ESLint / 类型债与注释治理提供独立 JSON / Markdown baseline。
    - 文档治理已补充 `pnpm docs:check:line-count:candidate` 与 `pnpm docs:check:source-of-truth:candidate` 两条候选入口，用于评估高频页扩面与翻译 freshness 收紧，但默认 blocker 行为仍保持不变。
- **最近一次上收阶段**:
    - 第三十九阶段（5.1-5.5 首轮 baseline 化：`check:scripts` + `audit:simple-duplicates` + `audit:eslint-debt` + `audit:comment-drift` + 两条 docs candidate，上收为独立脚本入口）。
    - 第四十阶段（发布前 pre-check 统一化：`release:check` / `release:check:full` 接入固定回归入口）。
- **下一次可切片方向**:
    - 先清理 `audit-comment-drift` 与两条 docs candidate 的误报 / warning 面。
    - 再评估是否将治理脚本从独立 baseline 升格进入 `regression:weekly` warning 面。

## 周期性回归验证层

> **定位**：本层不是"一个任务"，而是所有长期主线的健康检查层。它不产生直接改进，只验证"没有回退"。按固定日历节奏执行，不参与阶段切片容量竞争。

### 固定执行入口

三条入口及其命令组合在 [项目规划规范 §4.2 固定调度入口](../standards/planning.md) 中完整定义，此处仅列出摘要：

| 节奏 | 入口 | 最小固定组合 | 触发条件 |
|:---|:---|:---|:---|
| 周级 | `pnpm regression:weekly` | coverage + deps audit + source-of-truth + i18n + duplicate-code + script-governance | 每周一次 |
| 发版前 | `pnpm regression:pre-release` | release:check:full + i18n + perf:budget:strict + duplicate-code | 每次发版前 |
| 阶段收口前 | `pnpm regression:phase-close` | coverage + release:check:full + i18n + perf:budget:strict + duplicate-code:strict + review-gate | 阶段归档前 |

- 当前固定入口已覆盖 `script-governance` 的 5.1 脚本自检：`pnpm governance:check:scripts` 已进入 weekly warning 基线；5.2 `pnpm governance:audit:simple-duplicates`、5.3 `pnpm governance:audit:eslint-debt`、5.4 `pnpm governance:audit:comment-drift` 与 5.5 docs candidate 入口仍保持独立 baseline，待误报与 warning 面收敛后再评估是否进入更高频回归。

### 覆盖矩阵（每条长期主线的回归覆盖状态）

| 长期主线 | 周级覆盖 | 发版前覆盖 | 阶段收口覆盖 |
|:---|:---|:---|:---|
| #1 测试覆盖率治理 | ✅ `test:coverage` | — | ✅ `test:coverage` |
| #2 ESLint / 类型债治理 | ✅ `lint` | ✅ `release:check:full` (内含) | ✅ `release:check:full` (内含) |
| #3 结构复用治理 | ✅ `duplicate-code:check` | ✅ `duplicate-code:check` | ✅ `duplicate-code:check:strict` |
| #4 注释治理 | — | — | — (暂无自动检查) |
| #5 Postgres 治理 | — | — | — (依赖 live sample，非自动) |
| #6 国际化治理 | ✅ `i18n:audit:missing` + `i18n:audit:duplicates` + `docs:check:i18n` | ✅ `docs:check:i18n` | ✅ `docs:check:i18n` |
| #7 文档治理 | ✅ `docs:check:source-of-truth` + `docs:check:line-count` | ✅ `docs:check:source-of-truth` | ✅ `docs:check:source-of-truth` |
| #8 Windows 性能治理 | — | ✅ `test:perf:budget:strict` | ✅ `test:perf:budget:strict` |
| #9 脚本治理 | ✅ `governance:check:scripts` | — | — (`audit:simple-duplicates` / `audit:eslint-debt` / `audit:comment-drift` / docs candidate 暂保持独立 baseline) |
| #10 站点性能治理 | — | ✅ `test:perf:budget:strict` | ✅ `test:perf:budget:strict` |

> 标注 `—` 的条目表示当前缺少自动化回归覆盖，是后续回归层扩面的候选方向。

### 漂移路由规则

回归验证发现的问题不自行修复，而是按以下规则路由到对应长期主线的下一次切片候选：

| 回归发现问题 | 路由目标 |
|:---|:---|
| coverage 下降或测试有效性退化 | → 长期主线 #1（测试覆盖率治理） |
| ESLint warning 反弹或新 type 债 | → 长期主线 #2（ESLint 治理） |
| duplicate-code 基线反弹 | → 长期主线 #3（结构复用治理） |
| i18n missing / duplicate keys / raw key 暴露 | → 长期主线 #6（国际化治理） |
| 文档事实源 stale 或行数超阈值 | → 长期主线 #7（文档治理） |
| 性能预算超标（bundle / Lighthouse） | → 长期主线 #10（站点性能治理） |
| Windows Dev / Build 性能退化 | → 长期主线 #8（Windows 性能治理） |
| 孤儿脚本、临时脚本残留、脚本入口漂移或治理脚本缺失 | → 长期主线 #9（脚本治理） |
| 依赖安全 high+ 漏洞 | → 直接 blocker，在当前阶段修复 |
| 跨多条主线的问题 | → 取最匹配的一条路由，其他在路由备注中引用 |

### 回归记录管理

- 每次回归执行后，结果写入 `docs/reports/regression/current.md`。
- 当 `current.md` 超过 500-700 行 warning、700+ 行 blocker 时，触发滚动归档：将旧记录整体迁移到 `docs/reports/regression/archive/`，主窗口仅保留近线记录。
- 滚动归档的执行由回归层在阶段收口时统一触发，不另设独立的长期主线。
- （本条吸收了原 backlog 长期主线 #8 "回归记录独立归档与深度分层" 的全部职责。）

## 短期 / 一次性候选任务（上收后去重）

> 共享说明：除非单项另有说明，本区块条目当前均处于“候选评估中”，默认尚未满足正式上收前置条件；只有当条目内约束、门槛或预研结论闭环后，才允许写入 roadmap / todo。

> 2026-06 批次 8 项短期候选已全部上收归档（Phase 47-51），详细记录见 [todo-archive.md](./todo-archive.md)。后续新增短期候选直接在下方续写。

### 延后新增能力保留池（当前不建议优先上收）

1. **桌面端应用 (Desktop Application)**
- **Tauri 跨平台应用**:
    - 实现桌面客户端骨架，支持单站点/多站点管理。
    - 支持离线 Markdown 写作与间断性云端同步功能。
    - 提供原生菜单和系统集成，提升桌面体验。

2. **极客技术增强 (Geek Tech Extras)**
- **可执行代码块支持**:
    - 实现 Markdown 代码块在特定环境下的运行与结果输出。
    - 支持常见编程语言的代码执行（如 JavaScript、Python、Shell）。

3. **主题生态系统 (Theme Ecosystem)**
- **主题社区与发布平台**:
    - 允许创作者发布、分享并由他人安装自定义主题。
    - 建立安全审核机制防范 XSS 攻击。
- **画廊与市场**:
    - 支持保存多套自定义配置，建立主题预览、发布与管理中心。
    - 提供主题评分、评论和下载统计。
- **安全性与性能**:
    - 实现针对发布主题的自动化 XSS 扫描。
    - 使用 CSS Layer 分层策略提升主题性能。

4. **付费增强验证候选（源自商业化转型重评）**
- **状态说明**:
    - 第三十二阶段已按"多语言内容资产化增强包的统一承接入口"完成首轮交付，独立说明 / 申请页、单一主卖点文案与三条公开入口（Demo Banner / About 页 / Footer）已形成"入口 -> 承接页 -> 申请 / 候补名单"最小闭环。
    - 下一步继续观察候选转化信号，暂不追加新的付费增强实现条线；具体执行与验证以 `roadmap.md` / `todo-archive.md` 第三十二阶段归档结论为准。
- **2026-06 扩展：会员 / 付费订阅体系 (P2, 长期)**:
    - **背景**: Ghost 的核心差异化在会员付费闭环。墨梅已有完整订阅者管理、邮件推送和 Better-Auth 用户体系，差距在于支付集成和内容付费墙。竞品对标：Ghost 的 Membership Tiers + Stripe 集成 ([source](https://ghost.org/features/))。
    - **最小范围**: 会员等级（Free / Supporter / Premium）、文章级付费墙（公开 / 订阅者可见 / 付费可见）、Stripe 支付集成、会员管理后台、收入仪表盘。
    - **非目标**: 不建课程/数字产品商城、不做复杂定价/折扣/优惠券引擎、不与 Patreon 模式竞争。
    - **前置条件**:
        - 先确认候补名单的转化信号是否支持继续投入。
        - 评估 Stripe 在目标区域（含中国大陆）的可用性，必要时预留支付宝/微信支付扩展点。
        - 确认 Better-Auth 的角色扩展模型足以支撑会员等级。

5. **播客与多媒体扩展 (Podcast & Multimedia)**
- **全站沉浸式播放**:
    - 全站悬浮播放器，支持跨页面断点续播与内容同步。

6. **AI 视频生成与增强 (AI Video Generation & Enhancement)**
- **多模态内容产出**:
    - 探索集成视频生成模型（如 Seedance 2.0、~~Sora 2.0~~ 等），支持基于文章内容或脚本生成动态视频素材。
    - 实现“文章转视频”工作流，为技术博文自动生成短视频概览或演示。

7. **国际化语种扩展留档（西语 / 葡语 / 法语 / 俄语 / 德语）**
- **留档范围**:
    - 记录未来可扩展语种候选：西班牙语（es）、葡萄牙语（pt）、法语（fr）、俄语（ru）、德语（de）。
    - 本条仅用于 backlog 留档与前置评估，不代表当前或下一短期阶段承诺上线。
- **当前结论**:
    - 短期内不规划新增更多语言支持，继续优先保障现有语言链路稳定性、翻译质量与性能基线。
    - 若后续上收，需先补齐 locale 注册、路由策略、SEO 元信息、翻译资源拆分与回归预算评估，再进入正式阶段规划。

### 2026-06 调研发现的新增候选功能

> **核实说明**：首轮调研误将已实现的邮件/订阅/评论系统列为缺口。第二轮基于 CHANGELOG、源码审计、模块索引重新核实后，确认墨梅在这些领域已非常成熟。以下候选聚焦于**核实后确认的真实盲区**。
> **已上收并移除项**：AI 内容审计（Phase 42）、内容日历（Phase 42）、AI 内容多格式复用（Phase 43）、Blogroll 友链 RSS 聚合（Phase 44）、隐私优先自托管分析集成（Phase 45-46）已交付并从候选池移除。

8. **Digital Garden / 知识花园模式 (P2, 探索)**
- **背景**: Digital Garden 是 2025-2026 年个人网站的重要趋势，强调双向链接、内容生长状态、非时序导航 ([Maggie Appleton](https://maggieappleton.com/garden-history))。
- **最小范围**: 文章间双向引用自动检测与「被引用」展示、内容成熟度标记 (draft → evergreen)、可选的知识图谱可视化。
- **非目标**: 不做完整 Zettelkasten 笔记系统、不与 Obsidian/Logseq 竞争。
- **前置条件**: 先评估双向链接的存储模型 (JSON 字段 vs 关联表) 与对现有查询的性能影响。
- **当前状态**:
    - 第四十五阶段已完成 go/no-go 评估并输出 No-Go 结论（当前阶段不进入实现，保留后续 P2 候选）。
    - 评估事实源：[`docs/design/governance/archive/digital-garden-evaluation.md`](../design/governance/archive/digital-garden-evaluation.md)。

9. **AI 编辑增强功能套件 (P1-P2, 候选)**
- **背景**: 当前编辑器已有 AI 标题建议、摘要生成、标签推荐、Slug 建议和翻译功能。为进一步提升写作效率，需要扩展 AI 辅助编辑能力，覆盖内容创作的完整生命周期。
- **功能清单**:
    | 功能 | 优先级 | 说明 |
    |:---|:---|:---|
    | **改写 (Rewrite)** | P1 | 重新表述选中内容，保持原意但改变表达方式，支持多种风格（正式/口语/学术） |
    | **续写 (Continue)** | P1 | 基于现有内容自动继续写作，保持风格和逻辑一致性 |
    | **审查 (Review)** | P1 | 检查内容的语法、逻辑、风格、事实准确性等问题，提供修改建议 |
    | **扩写 (Expand)** | P2 | 将简短内容扩展为更详细的版本，补充论据、例子或解释 |
    | **缩写 (Condense)** | P2 | 将长内容压缩为更简洁的版本，保留核心信息 |
    | **编辑视角检查** | P2 | 从专业编辑角度检查内容质量：结构、论证、引用、原创性 |
    | **读者视角检查** | P2 | 从读者角度检查内容的可读性、吸引力、价值密度 |
- **技术方案**:
    - 复用现有 `usePostEditorAI` composable 架构
    - 新增 `/api/ai/rewrite`、`/api/ai/continue`、`/api/ai/review`、`/api/ai/expand`、`/api/ai/condense` 等 API 端点
    - 复用 `server/services/ai/text.ts` 中的 AI 调用和计费逻辑
    - 支持选中文本局部操作和全文操作两种模式
- **非目标**: 不做自动发布、不做内容生成（仍需用户确认）、不替代专业编辑工具
- **前置条件**:
    - 确认 AI 额度计费策略是否支持新增操作类型
    - 评估 prompt 设计对不同语言的支持策略
- **验收标准**:
    - 每个功能至少覆盖中英文双语
    - 操作结果支持撤销/重做
    - 复用现有 AI 计费和额度管理
    - 提供操作前后对比视图

### 2026-07 批次 — 已上收并完成

> #10 CLI/MCP API 客户端复用优化 → Phase 54-55 完成阶段一+阶段二，CLI +15、MCP +16 方法覆盖率达 100%。
> #11 外部接口扩展 → Phase 55 完成全部 5 组外部接口（分类/标签/灵感 CRUD + 灵感转文章 + 文章版本）。
> #12 AI 功能备用路线与自动降级 → Phase 55 完成文本+图片 fallback 链、透明切换与降级日志。

### 2026-07 批次剩余候选

10. **RSS 订阅链接美化 (P2, 候选)**
- **背景**: 当前 RSS feed 输出为原始 XML，浏览器直接显示时可读性差。由于 XSLT 即将被 Chrome/Firefox/Safari 弃用，需要采用 XML + CSS 方案进行美化。
- **技术方案**:
    - 在 RSS feed 的 XML 头部添加 `<?xml-stylesheet?>` 指令
    - 创建 CSS 样式文件（`/assets/rss-style.css`）
    - CSS 支持响应式设计，适配移动端
    - 保留一键订阅到常见 RSS 阅读器的功能
- **非目标**: 不改变 RSS feed 的内容结构、不引入 JavaScript 交互、不做完整的 RSS 阅读器
- **前置条件**:
    - 确认 `feed` 库支持自定义 XML 头部
    - 评估 CSS 文件的托管和缓存策略
- **验收标准**:
    - RSS feed 在浏览器中显示为美观的 HTML 样式
    - 响应式设计，移动端可用
    - 一键订阅按钮正常工作
    - RSS 阅读器仍能正常解析 feed
- **详细方案**: 待设计

### 2026-07 迁移功能增强候选任务

11. **本地图片自动上传与迁移 (P0, 候选)**
- **背景**: 当前迁移 CLI 明确声明"暂不处理本地图片上传，建议用户先将图片托管至云端"。这是迁移体验最大的短板——用户需要手动将 Hexo 的 `source/images/` 目录中的图片上传到对象存储，再手动替换 Markdown 中的相对路径引用，门槛极高。
- **问题分析**:
    - Hexo 文章常使用相对路径引用本地图片：`![](../images/cover.png)`、`![](/posts/xxx/image.jpg)`
    - 迁移后这些相对路径全部失效，导致图片 broken
    - 手动托管+替换 URL 的流程对非技术用户极不友好
- **技术方案**:
    - CLI 扫描 Markdown 正文中的相对路径图片引用（`![](...)` 和 `<img src="...">`）
    - 解析相对路径为本地文件系统绝对路径
    - 调用 `POST /api/upload/direct-auth` 获取上传凭证
    - 批量上传图片到对象存储
    - 替换正文中的图片 URL 为上传后的公共地址
    - 支持 `--upload-images` 开关，默认关闭（向后兼容）
- **非目标**: 不处理视频/音频等大文件上传、不做图片压缩/裁剪、不自动检测外部图床链接
- **前置条件**:
    - 确认对象存储上传 API 的批量并发限制
    - 评估大量图片上传的超时策略
- **验收标准**:
    - 扫描并上传本地相对路径图片
    - 正文中的图片 URL 自动替换为对象存储公共地址
    - 封面图（`coverImage`）如果是本地路径也同步处理
    - 上传失败的图片在报告中明确标记，不阻塞文章导入
    - `pnpm typecheck` + `pnpm lint` 通过
- **ROI**: 价值 4 / 契合度 4 / 复杂度 3 / 风险 2 = **2.33**
- **详细方案**: 待设计

12. **迁移元数据字段扩展 (P1, 候选)**
- **背景**: 当前 CLI 的字段映射已覆盖核心字段（title、date、tags、category、slug、summary、coverImage、audio 等），但部分对 SEO 和历史数据继承有意义的字段尚未支持。CLI README 已列出不支持字段清单。
- **待扩展字段**:
    | 字段 | 优先级 | 说明 |
    |:---|:---|:---|
    | `updatedAt` | P1 | 文章更新时间，对 SEO `article:modified_time` 有意义 |
    | `views` | P2 | 历史浏览量，数据继承场景需要 |
    | `disableComment` | P2 | 用户显式关闭评论的设置 |
    | `updated` | P2 | Hexo 的 `updated` 字段别名 |
- **技术方案**:
    - 扩展 `packages/cli/src/parser.ts` 的 `convertToMomeiPost` 函数
    - 扩展 `utils/schemas/external-post-import.ts` 的 Zod schema
    - 扩展 `server/api/external/posts.post.ts` 的处理逻辑
    - 补充单元测试
- **非目标**: 不支持 `metadata.tts`、`metadata.scaffold`、`metadata.publish.intent` 等内部结构的导入
- **前置条件**:
    - 确认 `Post` 实体是否已有 `updatedAt` 字段
    - 评估 `views` 字段是否允许外部写入
- **验收标准**:
    - `updatedAt` 字段正确映射并落库
    - 扩展字段的 Front-matter 别名正确解析
    - 不影响现有字段映射的向后兼容性
    - 新增测试覆盖扩展字段场景
- **ROI**: 价值 2 / 契合度 3 / 复杂度 1 / 风险 1 = **2.00**
- **详细方案**: 待设计

13. **安装引导向导 (P2, 候选)**
- **背景**: 设计文档 `docs/design/modules/migration.md` §3 已完整规划了安装引导向导（Onboarding Wizard），包括环境自检、管理员创建、站点基本配置、数据迁移建议四个步骤。该功能是首次用户体验的关键入口，但尚未实现。
- **技术方案**:
    - 新增 `/onboarding` 页面（基于 PrimeVue Stepper 组件）
    - 新增 `server/api/system/initialize` 接口，处理管理员创建、配置写入及"初始化锁定"逻辑
    - 实现 `RuntimeConfig = Merged(Environment, Database Settings)` 配置混合模式
    - 创建 `server/utils/settings.ts` 工具，用于从数据库加载动态配置
    - 在 App 顶层增加重定向逻辑：当数据库用户表为空时自动跳转 `/onboarding`
- **非目标**: 不支持多管理员批量创建、不做数据导入向导（仅展示 CLI 使用说明）、不做主题配置
- **前置条件**:
    - 完成配置层级升级的设计评审
    - 评估数据库 Settings 表的 schema 变更影响
- **验收标准**:
    - 首次访问时自动跳转到 `/onboarding`
    - 环境自检正确显示数据库、Node 版本、环境参数
    - 管理员创建成功后可正常登录
    - 站点配置正确写入数据库
    - 初始化完成后禁止再次访问向导
    - `pnpm typecheck` + `pnpm lint` + `pnpm test` 通过
- **ROI**: 价值 4 / 契合度 5 / 复杂度 4 / 风险 3 = **1.50**
- **详细方案**: [迁移与集成设计文档 - 引导安装向导](../design/modules/migration.md#3-引导安装向导-installation-wizard)

14. **多平台迁移适配器 (P2, 候选)**
- **背景**: 当前迁移 CLI 仅支持 Hexo 格式的 Markdown 文件解析。WordPress、Hugo、Jekyll 等其他主流博客平台的用户无法直接使用 CLI 迁移。虽然 Hexo 是目标用户群的主要来源，但扩展多平台支持可以降低更多用户的迁移门槛。
- **技术方案**:
    - 抽象 `ContentParser` 接口：`parse(sourceDir): Promise<ParsedPost[]>`
    - 实现适配器：
        - `HexoParser`（已有，从 `parser.ts` 重构）
        - `WordPressParser`（解析 WordPress XML 导出文件）
        - `HugoParser`（解析 Hugo Front-matter，TOML/YAML/JSON）
        - `JekyllParser`（解析 Jekyll Front-matter）
    - CLI 命令增加 `--format hexo|wordpress|hugo|jekyll` 参数
    - 统一输出为 `ParsedPost` 结构，复用现有导入链路
- **非目标**: 不支持在线 API 导入（如 WordPress REST API）、不做自动格式检测、不做平台特定的插件/主题迁移
- **前置条件**:
    - 评估各平台 Front-matter 的差异和兼容性
    - 确认是否需要引入 XML 解析库（WordPress 导出格式）
- **验收标准**:
    - 至少支持 Hugo 格式（TOML/YAML Front-matter）
    - 各平台的 title、date、tags、categories、content 正确映射
    - `--format` 参数正确选择解析器
    - 新增适配器有对应的单元测试
    - 现有 Hexo 解析行为无回归
- **ROI**: 价值 3 / 契合度 3 / 复杂度 3 / 风险 2 = **1.50**
- **详细方案**: 待设计

15. **迁移进度可视化与断点续传 (P3, 候选)**
- **背景**: 当前 CLI 支持 `--concurrency` 并发导入，但大型博客（数百篇文章）迁移时，如果中途失败需要从头开始。断点续传能力可以显著改善大型迁移的体验。
- **技术方案**:
    - CLI 在本地维护迁移状态文件（`.momei-migration-state.json`）
    - 记录每篇文章的导入状态：pending / success / failed / skipped
    - 导入前检查状态文件，跳过已成功的文章
    - 支持 `--resume` 参数启用断点续传
    - 支持 `--clean` 参数清除状态文件重新开始
    - 进度条显示：已成功 / 已失败 / 待处理 / 总数
- **非目标**: 不做分布式迁移、不做跨机器续传、不做自动重试失败项
- **前置条件**:
    - 评估状态文件的格式和兼容性
    - 确认状态文件的存放位置（源目录 vs 当前目录）
- **验收标准**:
    - 中断后重新运行可跳过已成功的文章
    - `--resume` 参数正确启用续传模式
    - 进度显示实时更新
    - 状态文件格式清晰可读
- **ROI**: 价值 2 / 契合度 2 / 复杂度 3 / 风险 2 = **1.00**
- **详细方案**: 待设计

16. **响应式状态模型收敛：reactive 到 ref 的渐进迁移 (P1, 候选)**
- **背景**:
    - 当前仓库 `reactive()` 使用总量为 `56` 处，其中生产代码 `29` 处、测试代码 `27` 处。生产代码主要集中在表单状态、筛选器状态、弹窗状态和少量复合对象状态。
    - 已识别高频文件包括：`composables/use-admin-friend-links-page.ts`（4 处）、`pages/admin/users/index.vue`（3 处）、`composables/use-admin-list.ts`（2 处）、`pages/admin/comments/index.vue`（2 处）、`pages/admin/submissions/index.vue`（2 处）、`pages/login.vue`（2 处）、`pages/register.vue`（2 处）。
    - 现状虽能正常工作，但“是否为响应式变量”的可见性不足，且在类型收窄、泛型边界、重构时行为判断上，`ref` 的显式 `.value` 语义更有利于长期维护。
- **准入结论**:
    - 该事项不属于当前阶段收口项，也非阻塞型修复；应先作为短期候选进入 backlog，待下一阶段按窄切片方式上收。
- **可迁移性分级（基于当前代码结构）**:
    - **高（优先）**：单对象表单/错误对象（如 `form`、`errors`、`passwordForm`、`profileForm`、`deleteDialog`），可直接迁移为 `ref<{ ... }>()`，模板改动可控。
    - **中（次优先）**：筛选器/分页/排序对象（如 `filters`、`pagination`、`sort`），通常伴随 watch、debounce 或请求参数拼装，需配套调整读取和赋值路径。
    - **低（后置）**：深层嵌套且大量 `Object.assign` 的复合对象（如 `use-admin-friend-links-page.ts`、`settings-notifications.vue` 的聚合订阅状态），迁移收益存在但回归面较大，应后置并配测试先行。
- **执行范围（拟分三步上收）**:
    - **Step 1（低风险首批）**：登录、注册、评论、权益页、个人设置与安全设置中的 `form/errors` 类对象。
    - **Step 2（中风险）**：后台列表页和筛选组件中的 `filters/pagination/sort/dialog` 类对象；同步补齐 composable 返回值类型约束。
    - **Step 3（高风险）**：`use-admin-friend-links-page.ts`、`settings-notifications.vue` 等复合状态对象，按“单模块单切片”推进。
- **非目标**:
    - 不追求“全仓清零 reactive”。
    - 不在同一阶段同时重构业务流程与状态模型。
    - 不改动当前 API 契约或页面交互语义。
- **最小验证矩阵 / 证据落点**:
    - 质量门：`pnpm lint`、`pnpm typecheck`。
    - 定向验证：首批上收时至少补齐受影响组件/页面的失败路径断言（表单校验失败、提交失败、弹窗开关、筛选触发）。
    - 证据落点：`docs/reports/regression/current.md` + 对应阶段 `todo-archive.md`。
- **回滚边界**:
    - 以文件为单位回滚，不做跨模块混合回滚。
    - 若某切片出现 `.value` 传播导致的可读性/缺陷回归，可在该切片内保留原 `reactive` 并记录原因，不阻断其他切片推进。
- **ROI**: 价值 4 / 契合度 4 / 复杂度 3 / 风险 2 = **1.60**
- **详细方案**: 待设计（建议上收前先输出“reactive 使用清单 + 迁移优先级 + 验证用例映射”）。

## 相关文档

- [项目计划](./roadmap.md)
- [待办事项](./todo.md)
- [待办归档](./todo-archive.md)
- [项目规划规范](../standards/planning.md)




