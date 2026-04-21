# Hexo 风格文章仓库同步能力评估

## 1. 背景与目标

当前仓库已经具备两块可复用基础能力：

- 服务端可以把已发布文章导出为 Hexo 兼容的 Markdown + Front-matter。
- CLI 可以反向解析 Hexo Front-matter 并导回墨梅内部文章结构。

本轮工作的目标不是引入完整的 Git 客户端、双向同步或桌面式仓库管理，而是在现有能力上落一个最小闭环：

- 输入：已发布文章。
- 转换：Hexo 风格 Markdown + Front-matter，并将站内相对媒体地址改写为绝对 URL。
- 输出：把 Markdown 文件推送到单个远端内容仓库。
- 审计：把最近一次同步结果回写到文章元数据，便于后台审计和失败追踪。

## 2. 范围冻结

### 2.1 本次纳入范围

- 手动触发的单篇文章同步。
- 同步目标限定为单个 GitHub 或 Gitee 仓库。
- 令牌鉴权。
- 使用仓库 Contents API 直接创建或更新 Markdown 文件。
- 同步状态写入 `Post.metadata.integration.hexoRepositorySync`。

### 2.2 明确不纳入范围

- 双向同步与冲突合并。
- SSH 推送、裸仓库 clone、工作树管理。
- 二进制媒体镜像到仓库。
- 后台 UI 面板整合。
- 定时批量同步、Webhook 回推、分支合并策略。

## 3. 现有实现复用结论

### 3.1 已存在能力

- `server/services/post-export.ts` 已输出 Hexo 兼容 Front-matter。
- `packages/cli/src/parser.ts` 已消费 Hexo Front-matter。
- `server/services/post-distribution.ts` 已沉淀“状态写回文章元数据”的治理模式。
- 设置系统已支持环境变量优先、默认值回退与内部敏感配置隔离。

### 3.2 缺口

- 目前没有任何 GitHub / Gitee 仓库写入实现。
- 当前文章分发 UI 仅面向 `memos` 与 `wechatsync`，直接扩展成本偏高。
- 现有 Markdown 导出默认保留站内相对资源路径，不适合离站仓库直接消费。

## 4. 方案选型

### 4.1 为什么不直接做 Git 推送

Git push 路线需要处理：

- clone / fetch / branch checkout 生命周期。
- 宿主机 Git 可执行文件与凭据管理。
- 并发写入与锁。
- Serverless / 容器环境下临时目录治理。

这会把第一阶段从“内容发布样机”拉升成“仓库编排系统”。与当前 Todo 的“候选落地”目标不匹配，因此先止步于 Contents API。

### 4.2 为什么选 Contents API

- GitHub 与 Gitee 都提供单文件创建 / 更新接口。
- 对单篇文章同步足够直接，失败面清晰。
- 易于按文章粒度写回 `remoteSha`、`remoteUrl`、失败原因等审计信息。
- 不需要引入新的长期运行进程或本地 Git 状态目录。

## 5. Provider 对比

| 维度 | GitHub | Gitee | 本次结论 |
| :--- | :--- | :--- | :--- |
| 单文件读取 | `GET /repos/{owner}/{repo}/contents/{path}?ref=` | `GET /repos/{owner}/{repo}/contents/{path}?ref=&access_token=` | 都可用 |
| 单文件写入 | `PUT /repos/{owner}/{repo}/contents/{path}` | 新建 `POST`，更新 `PUT` | 需要轻量分支判断 |
| 鉴权 | `Authorization: Bearer <token>` | 查询参数 `access_token` 最稳妥 | 统一抽象可覆盖 |
| 返回远端标识 | `content.sha` / `commit.sha` / `html_url` | `content.sha` / `commit.sha` / `html_url` | 足够写回审计 |
| 首版复杂度 | 低 | 低到中 | 两者都可进入候选实现 |

结论：首版保留统一 provider 抽象，同时优先围绕 GitHub 约束设计，Gitee 通过差异分支兼容。

风险注记：Gitee 在读取单文件内容时，首版仍需要把 `access_token` 放入查询参数。这不会被当前应用日志主动记录，但反向代理、APM 或上游网关若采集完整 URL，仍可能暴露令牌，因此部署时应确保相关访问日志脱敏或关闭查询串落盘。

## 6. 数据与配置契约

### 6.1 新增配置项

- `HEXO_SYNC_ENABLED`
- `HEXO_SYNC_PROVIDER`
- `HEXO_SYNC_OWNER`
- `HEXO_SYNC_REPO`
- `HEXO_SYNC_BRANCH`
- `HEXO_SYNC_POSTS_DIR`
- `HEXO_SYNC_ACCESS_TOKEN`

其中 `HEXO_SYNC_ACCESS_TOKEN` 视为内部敏感配置，只允许通过环境变量注入，不从数据库回读。

首版补充约束：虽然非敏感键已经映射到 `SettingKey`，但当前候选实现不会把这些字段接入通用系统设置页，避免管理员在保存无关设置时隐式改写仓库同步配置。

### 6.2 元数据写回契约

同步状态统一写入：

- `Post.metadata.integration.hexoRepositorySync.provider`
- `Post.metadata.integration.hexoRepositorySync.owner`
- `Post.metadata.integration.hexoRepositorySync.repo`
- `Post.metadata.integration.hexoRepositorySync.branch`
- `Post.metadata.integration.hexoRepositorySync.filePath`
- `Post.metadata.integration.hexoRepositorySync.remoteUrl`
- `Post.metadata.integration.hexoRepositorySync.remoteSha`
- `Post.metadata.integration.hexoRepositorySync.lastSyncedAt`
- `Post.metadata.integration.hexoRepositorySync.lastFailureAt`
- `Post.metadata.integration.hexoRepositorySync.lastFailureReason`
- `Post.metadata.integration.hexoRepositorySync.lastMessage`

## 7. 文件路径与内容规则

### 7.1 远端文件路径

首版路径规则：

```text
{postsDir}/{language}/{slug}.md
```

默认值：

```text
source/_posts/{language}/{slug}.md
```

这样做的原因：

- 避免不同语言文章直接覆盖。
- 不引入日期前缀和额外 permalink 规则，保持最小可预测路径。
- 与现有导出、导入链路兼容，后续若要切换为日期命名可单独治理。

### 7.2 Front-matter 与正文

继续复用现有导出映射：

- `title`
- `date`
- `categories`
- `tags`
- `abbrlink`
- `description`
- `author`
- `language`
- `image`
- `audio_*`

### 7.3 媒体策略

首版不镜像二进制资源，只做 URL 正规化：

- Front-matter 中的封面和音频地址若是站内根相对路径，改写成站点绝对 URL。
- Markdown 正文中的 `![](/...)` 与常见 HTML 媒体标签 `src` / `poster` 同样改写为绝对 URL。

这样可以保证远端仓库被 Hexo 或其他静态站点消费时，不依赖当前站点部署根路径推断。

## 8. 接口与执行态

### 8.1 首版接口

新增后台手动触发接口：

- `POST /api/admin/posts/:id/hexo-repository-sync`

请求体：

```json
{
  "operation": "sync"
}
```

允许值：

- `sync`
- `retry`

### 8.2 权限与对象限制

- 仅管理员或文章作者可触发。
- 仅 `published` 状态文章允许同步。

## 9. 失败分类

首版统一映射到现有失败语义：

- `auth_failed`
- `rate_limited`
- `network_error`
- `content_validation_failed`
- `remote_missing`
- `unknown`

这样可以沿用现有分发治理的失败口径，而不引入第二套失败分类体系。

## 10. 验证矩阵

首版最低验证要求：

- 单元测试覆盖文件路径生成。
- 单元测试覆盖 GitHub Contents API 创建路径。
- 单元测试覆盖绝对媒体 URL 改写。
- 单元测试覆盖鉴权失败分类与元数据写回。
- 定向类型检查确保新增服务与 API 路由通过。

## 11. 后续增量方向

下一阶段若继续扩展，可按以下顺序推进：

1. 后台文章分发 UI 加入“仓库同步”入口，并与现有分发总览统一展示。
2. 支持批量同步和定时同步。
3. 支持媒体镜像到仓库或对象存储中转目录。
4. 评估 SSH / Git push 路线，用于多文件事务性提交。
5. 引入冲突检测与远端改动保护策略。
