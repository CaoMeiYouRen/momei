# Cloudflare 运行时兼容研究与止损结论

## 1. 结论摘要

本轮研究的结论是：**第二十五阶段不继续投入“整站迁移到 Cloudflare Pages / Workers 运行时”的实现开发，当前仅保留外围能力接入，并把整站适配降级为后续条件触发型预研事项。**

当前推荐方向如下：

| 方向 | 结论 | 说明 |
| :--- | :--- | :--- |
| 继续推进整站 Cloudflare 运行时适配 | 否 | 现有阻塞属于结构性问题，不是再补几条兼容分支即可收口。 |
| 暂停整站适配投入 | 是 | 当前 ROI 不足，且会挤压部署体验、编辑器稳定性等更高收益主线。 |
| 仅保留外围能力接入 | 是 | R2、Turnstile、CDN/WAF/DNS、以及“Cloudflare 触发 Node 主站任务入口”的模式仍具备实际价值。 |

本结论同时意味着：

- `Cloudflare Pages / Workers` 目前**不是**墨梅应用主体的正式部署路径。
- `Cloudflare D1` 目前**不是**主业务数据库候选，不进入当前阶段实施面。
- `wrangler.toml`、[server/routes/_scheduled.ts](../../server/routes/_scheduled.ts) 与相关说明只应视为外围能力探索痕迹或最小样机入口，不能被解读为“已支持整站 Cloudflare 运行时”。

## 2. 研究范围

本轮只回答以下问题：

1. 当前仓库是否具备整站迁移到 Cloudflare Workers / Pages 运行时的现实基础。
2. 若不具备，阻塞点是否可通过“小修补”解决，还是属于结构性改造。
3. 若保留最小样机，最小样机应该收敛到什么边界，避免误导为正式支持。
4. 后续若要重新评估，应该满足哪些触发条件。

本轮**不**做以下事项：

- 不启动 TypeORM 到其他 ORM 的迁移工程。
- 不把 D1 直接接入当前 `Post` / `User` / `Session` / `Setting` 等主业务模型。
- 不把 `wrangler` 调试入口升级为生产级整站部署流程。

## 3. 仓库内已确认事实

### 3.1 数据层仍以 TypeORM + Node 驱动为核心

- [server/database/index.ts](../../server/database/index.ts) 当前只接受 `sqlite`、`mysql`、`postgres` 三类数据库类型，并分别落到 `better-sqlite3`、`mysql`、`postgres` 驱动族。
- [server/database/index.ts](../../server/database/index.ts) 会在运行时初始化完整的 TypeORM `DataSource`，并加载全量实体、命名策略、自定义 logger、修复脚本与角色同步逻辑。
- [server/database/typeorm-adapter.ts](../../server/database/typeorm-adapter.ts) 还承担了 Better Auth 的数据库适配层；这意味着认证会话、账号、验证表等也直接绑在 TypeORM 数据访问模型上。

结论：当前不是“数据库能换成 SQLite 语义即可”，而是**整个后端持久化与认证契约都以 TypeORM 为中心组织**。

### 3.2 当前代码显式依赖大量 Node 运行时能力

已确认的代表性依赖包括：

- 文件系统与路径： [server/utils/logger.ts](../../server/utils/logger.ts)、[server/utils/storage/local.ts](../../server/utils/storage/local.ts)、[server/utils/i18n.ts](../../server/utils/i18n.ts)
- Redis 长连接： [server/utils/redis.ts](../../server/utils/redis.ts)、[server/utils/pv-cache.ts](../../server/utils/pv-cache.ts)
- SMTP 邮件： [server/utils/email/factory.ts](../../server/utils/email/factory.ts)
- WebSocket 客户端： [server/utils/ai/asr-volcengine.ts](../../server/utils/ai/asr-volcengine.ts)、[server/utils/ai/tts-volcengine.ts](../../server/utils/ai/tts-volcengine.ts)、[server/api/ai/asr/stream.ws.ts](../../server/api/ai/asr/stream.ws.ts)
- Node 内建模块：`node:crypto`、`node:zlib`、`node:async_hooks`、`fs`、`path`

结论：当前应用并非“少量 Node API 依赖”，而是**服务端基础设施、日志、存储、邮件、语音链路与任务执行都天然站在 Node 语义上**。

### 3.3 本地文件与对象存储是双轨模型，而非纯对象存储模型

- [server/utils/storage/factory.ts](../../server/utils/storage/factory.ts) 当前支持 `local`、`s3/r2`、`vercel_blob`。
- [server/utils/storage/local.ts](../../server/utils/storage/local.ts) 仍包含本地磁盘目录创建、空间检测、文件写入与路径拼接逻辑。
- [server/services/direct-upload.ts](../../server/services/direct-upload.ts) 说明 `r2` 路径实际上是复用 S3 兼容签名能力，而不是 Cloudflare 原生运行时绑定。

结论：R2 已经可用，但它只解决“对象存储”这一个切面，**并没有把整个应用从 Node 文件系统语义中剥离出来**。

### 3.4 定时任务的 Cloudflare 路径仍是实验性入口

- [wrangler.toml](../../wrangler.toml) 当前仅保留 `nodejs_compat`、`compatibility_date` 与 cron 触发配置，没有形成清晰的整站 Worker 主入口。
- [server/routes/_scheduled.ts](../../server/routes/_scheduled.ts) 当前依赖 `cf-scheduled` 请求头来判定 Cloudflare 触发。
- [server/api/tasks/run-scheduled.post.ts](../../server/api/tasks/run-scheduled.post.ts) 已经具备成熟的 HMAC / Bearer / Token 任务 webhook 入口，更适合作为“Cloudflare 只负责触发，主站仍在 Node 环境执行任务”的外围集成模式。

结论：当前最稳妥的 Cloudflare 任务路径不是“把任务逻辑搬进 Worker”，而是**让 Cloudflare 只做外部调度触发器**。

## 4. 外部平台事实

### 4.1 Workers 的 Node 兼容层不是完整 Node 进程

根据 Cloudflare Workers 官方文档：

- 启用 `nodejs_compat` 后可以获得一部分 Node API 与 polyfill。
- 但 `fs`、`http`、`https` 等兼容层存在额外限制，并不等价于真实 Node 运行时。
- 文档还明确指出，未列入兼容清单的 Node 模块不可假定为可用。

参考：

- <https://developers.cloudflare.com/workers/runtime-apis/nodejs/>
- <https://developers.cloudflare.com/workers/configuration/compatibility-flags/>

结论：`nodejs_compat` 只能降低部分门槛，**不能把当前这套 Node 中心架构直接变成 Workers 友好架构**。

### 4.2 D1 是 Cloudflare 原生 SQLite 语义数据库，但接入方式与当前 TypeORM 主栈不一致

根据 Cloudflare 文档：

- D1 主要通过 Worker Binding API 或 HTTP API 使用。
- D1 更接近“Cloudflare 管理型 SQLite 服务”，并非当前仓库正在使用的 `better-sqlite3` 文件驱动。

参考：

- <https://developers.cloudflare.com/d1/>
- <https://developers.cloudflare.com/workers/platform/storage-options/>

结论：D1 的问题不是“也是 SQLite，所以应该能直接替换”，而是**接入模型、运行时绑定方式、迁移方式与当前 TypeORM 驱动模型都不一致**。

### 4.3 Workers Cron Trigger 的官方入口是 `scheduled()` 处理器

根据 Cloudflare 文档：

- Cron Trigger 的正式处理方式是 Worker 模块导出的 `scheduled()` 处理器。
- 这与当前仓库中的 HTTP 路由 + `cf-scheduled` 请求头检测模型不是同一层接口。

参考：

- <https://developers.cloudflare.com/workers/configuration/cron-triggers/>
- <https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/>

结论：当前仓库中的 `_scheduled` 入口最多只能作为实验性适配痕迹，**不能被当成已验证的 Cloudflare 正式任务处理模型**。

### 4.4 TypeORM 当前没有 D1 驱动入口

根据 TypeORM 文档与源码：

- TypeORM 官方支持的数据库与驱动列表中不包含 D1。
- `DriverFactory` 中也没有 D1 驱动分支。
- 当前 SQLite 家族驱动仍围绕 `better-sqlite3`、`sql.js`、Capacitor、Cordova、Expo、NativeScript、React Native 等实现。

参考：

- <https://github.com/typeorm/typeorm/blob/master/README.md>
- <https://github.com/typeorm/typeorm/blob/master/src/driver/DriverFactory.ts>
- <https://github.com/typeorm/typeorm/blob/master/src/platform/PlatformTools.ts>

结论：只要主栈仍是 TypeORM，D1 就不是“补一个连接串”级别的问题，而是**缺少官方驱动落点**。

## 5. 阻塞清单

| 维度 | 当前现状 | Cloudflare 路线冲突 | 结论 |
| :--- | :--- | :--- | :--- |
| TypeORM | 当前数据库、认证适配、实体模型、查询习惯都围绕 TypeORM 组织 | D1 无官方 TypeORM 驱动；Workers 也不是当前驱动的默认运行目标 | 结构性阻塞 |
| Node 运行时依赖 | 文件系统、路径、Redis、SMTP、WebSocket、Node 内建模块大量存在 | `nodejs_compat` 不是完整 Node，尤其文件系统与长连接类依赖风险高 | 结构性阻塞 |
| 数据库契约 | 当前显式支持 sqlite/mysql/postgres 三套方言与初始化路径 | D1 只覆盖 SQLite 语义，且接入方式不是 `better-sqlite3` 文件驱动 | 高成本阻塞 |
| 文件存储 | 本地磁盘与对象存储并存，`local` 仍是一等能力 | Workers 无法承接当前本地磁盘路径；要整站适配必须先把本地盘语义彻底边缘化 | 高成本阻塞 |
| 定时任务 | Vercel / Node Webhook 已成熟，Cloudflare 路径偏实验 | 官方 Cron 处理器模型与当前 `_scheduled` 路由并不一致 | 中高风险阻塞 |
| AI / 通知链路 | 语音、邮件、外部分发依赖 WebSocket / SMTP / Redis / 第三方 SDK | 更适合继续运行在 Node 进程或拆到专门服务，不适合顺手搬进 Worker | 结构性阻塞 |

## 6. 当前唯一推荐的最小样机路径

### 6.1 样机目标

如果必须保留 Cloudflare 样机，本轮只推荐保留以下**外围能力样机**：

1. 应用主体继续部署在 Vercel、Docker 或自托管 Node。
2. Cloudflare 继续承接 R2、Turnstile、CDN / WAF / DNS 等边缘能力。
3. 如需使用 Cloudflare 调度，只让 Cloudflare 触发 [server/api/tasks/run-scheduled.post.ts](../../server/api/tasks/run-scheduled.post.ts) 这一成熟 webhook 入口，由主站执行真实任务。

### 6.2 不推荐的样机

以下路线本轮不推荐启动：

- 不推荐把 `Post` / `User` / `Session` / `Setting` 主库直接迁往 D1。
- 不推荐为当前 TypeORM 主栈强行拼装自定义 D1 driver。
- 不推荐把 `logger`、`local storage`、邮件、Redis、语音 WebSocket 等基础设施逐个打补丁迁到 Worker，再试图宣称“整站支持”。

### 6.3 若一定要做 D1 试验，边界必须收紧

若后续仍想保留一条 D1 技术可行性试验线，边界必须限定为：

- 只能做**独立 Worker 拥有的辅助表**试验，例如边缘任务执行日志、只读缓存索引或不接主业务模型的实验表。
- 不得接入当前 TypeORM 主实体。
- 不得把试验结果写成“墨梅已支持 D1 作为主数据库”。

## 7. 止损结论

### 7.1 当前决策

当前正式决策为：**仅保留外围能力接入，暂停整站 Cloudflare 运行时适配投入。**

原因如下：

1. 当前阻塞横跨 ORM、数据库驱动、Node 依赖、任务入口和基础设施抽象，不属于单点缺陷。
2. 即使强行推进，也会形成高耦合兼容分支，后续维护成本明显高于本阶段收益。
3. 当前阶段更高优先级事项是部署体验收敛、编辑器 / 渲染稳定性和持续性能治理。

### 7.2 对外口径

后续所有对外文档与说明统一采用以下口径：

- 墨梅当前**不支持**将应用主体完整部署到 Cloudflare Pages / Workers。
- 墨梅当前**支持或保留** Cloudflare 的外围能力接入，包括 R2、Turnstile、CDN / WAF / DNS，以及“由 Cloudflare 触发 Node 主站任务 webhook”的模式。
- `Cloudflare D1` 仍属于后续条件触发型评估项，而不是当前已支持数据库。

补充说明：若在 [docs/plan/roadmap.md](../../plan/roadmap.md) 等历史规划位置看到更积极的 Cloudflare 目标描述，应将其理解为当时的阶段规划意图，而不是当前版本的正式支持声明；当前支持边界以本研究文档、[部署指南](../../guide/deploy.md) 与 [快速开始](../../guide/quick-start.md) 为准。

## 8. 重新开启评估的触发条件

仅当以下条件至少满足前 3 项，才建议重新开启“整站 Cloudflare 运行时适配”评估：

1. 主持久化层不再依赖当前 TypeORM 驱动栈，或出现经过验证的 D1/Workers 兼容替代方案。
2. 文件系统、本地日志、本地存储、Redis 长连接、SMTP、WebSocket 等 Node 中心依赖完成明确拆分或替代。
3. 任务入口改为 Cloudflare 官方 `scheduled()` 处理模型，并完成独立可复跑验证。
4. 能给出明确的成本对比：迁移成本、功能损失、回归面、长期维护成本，以及相对于继续使用 Vercel / Docker / Node 的真实收益。

如果上述条件不满足，则后续只允许继续优化外围能力接入，不再重复投入整站运行时迁移预研。
