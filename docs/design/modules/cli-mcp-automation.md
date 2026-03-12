# CLI / MCP 自动化能力扩展设计

## 1. 概述 (Overview)

第十一阶段的“CLI / MCP 自动化能力扩展”目标不是再造一套独立于站内的 AI 能力，而是把站内已经存在的内容生成、翻译、媒体任务与任务审计能力，收敛为可由 API Key 驱动的外部自动化契约层，再由 `packages/cli` 与 `packages/mcp-server` 分别提供适合各自交互模式的入口。

当前仓库已经具备以下基础能力：

- 站内 AI 服务已支持标题建议、标签推荐、文本翻译、图片生成、TTS / 播客音频生成与 AI 任务记录。
- `packages/cli` 已具备迁移导入与迁移链接治理能力，适合批处理与可选等待模式。
- `packages/mcp-server` 已具备文章 CRUD / 发布能力，适合被 AI 客户端按工具调用。
- 翻译簇、taxonomy 绑定、音频元数据回填等语义已经在站内形成事实源。

缺口在于：这些能力此前主要暴露为会话鉴权接口，CLI 与 MCP 无法稳定复用，也没有统一的长任务查询模型。本设计用于冻结第一轮自动化能力范围与分层边界，确保 CLI、MCP 与站内后台共用同一套自动化语义。

## 2. 目标与非目标 (Goals & Non-goals)

### 2.1 目标

- 提供一组基于 API Key 的外部自动化接口，作为 CLI 与 MCP 的统一契约层。
- 将首轮能力收敛为五类：内容生成、全文翻译、媒体回填、发布编排、任务审计。
- 复用现有 `AITask` 长任务模型，避免为 CLI 或 MCP 单独引入第二套异步协议。
- 将“整篇文章翻译 + 翻译簇 / taxonomy 回填”从前端编辑器逻辑下沉到服务端工作流。
- 在图片生成与 TTS 生成完成后自动回填文章字段，并保留任务审计链路。

### 2.2 非目标

- 本轮不新增新的 AI 提供商、模型依赖或独立队列系统。
- 本轮不扩展站内编辑器 UI，只补齐服务端、CLI 与 MCP 的自动化入口。
- 本轮不把批量发布、批量 SEO 编排做成复杂工作流引擎，仅暴露最小可交付能力。
- 本轮不在 MCP 中实现交互式确认 UI，复杂确认由调用方在工具外完成。

## 3. 能力分层 (Capability Layers)

| 能力层 | 服务端事实源 | CLI 交互模式 | MCP 交互模式 |
| :--- | :--- | :--- | :--- |
| 内容生成 | `TextService` | 命令直接返回结果 | 工具直接返回结果 |
| 全文翻译 | `PostAutomationService` + `AITask` | 创建任务，可选 `--wait` | 创建任务并返回 `taskId` |
| 媒体回填 | `ImageService` / `TTSService` + `AITask` | 创建任务，可选 `--wait` | 创建任务并返回 `taskId` |
| 发布编排 | 既有外部文章发布接口 | 独立命令执行 | 继续由既有 `publish_post` 工具负责 |
| 审计查询 | `AITask` 查询接口 | `ai task <taskId>` | `get_ai_task` |

分层约束：

- 服务端是唯一允许落盘正文、taxonomy、封面图和音频元数据的执行层。
- CLI 负责参数归一化、终端输出与可选等待，不直接实现任务编排逻辑。
- MCP 负责以稳定工具面暴露能力，不承载长轮询与终端式确认体验。

## 4. 统一外部契约 (Unified External Contract)

### 4.1 外部接口

```http
POST /api/external/ai/suggest-titles
POST /api/external/ai/recommend-tags
POST /api/external/ai/translate-post
POST /api/external/ai/image/generate
POST /api/external/ai/tts/task
GET  /api/external/ai/tasks/:id
```

统一约束：

- 全部使用 API Key 鉴权。
- 短操作直接返回结果；长操作返回 `taskId`、初始状态与关联文章信息。
- 任务结果统一通过 `GET /api/external/ai/tasks/:id` 查询，不在 CLI 与 MCP 内复制状态机。

### 4.2 长任务响应语义

```ts
interface AutomationTaskStartResponse {
    taskId: string
    status: 'pending' | 'processing'
    type: string
    postId?: string
}

interface AutomationTaskStatusResponse {
    taskId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    type: string
    progress?: number
    result?: Record<string, unknown>
    error?: string
}
```

设计原则：

- CLI 默认不阻塞长任务，只有显式 `--wait` 时才轮询等待。
- MCP 始终返回任务启动结果，由调用方按需再次调用查询工具。
- 所有失败都通过 `AITask` 持久化，避免终端输出成为唯一错误来源。

## 5. 首轮能力范围 (First-scope Deliverables)

### 5.1 内容生成

- 标题建议：基于正文内容生成候选标题列表。
- 标签推荐：基于正文和现有标签上下文生成标签建议。

### 5.2 全文翻译与翻译簇回填

`translate-post` 任务支持：

- 指定源文章、目标语言，可选显式源语言。
- 可选翻译范围：`title`、`content`、`summary`、`category`、`tags`、`coverImage`、`audio`。
- 复用站内 `translationId` 语义，并在目标语言侧创建或更新译文草稿。
- 分类优先按翻译簇映射，标签按既有绑定或翻译建议进行回填。
- 保留封面图与音频元数据的跨语言继承语义。

### 5.3 媒体生成与回填

- 封面图生成：生成成功后自动将首张图片写回文章 `coverImage`。
- 音频生成：生成成功后自动写回文章音频元数据，沿用现有 TTS / 播客语义。

### 5.4 发布编排

- CLI 补齐 `publish <postId>`，与既有外部发布接口保持一致。
- MCP 继续复用既有 `publish_post`，避免发布能力重复命名。

## 6. 命令面与工具面 (CLI / MCP Surface)

### 6.1 CLI

```bash
momei ai suggest-titles <postId>
momei ai recommend-tags <postId>
momei ai translate-post <postId> --target-language <locale> [--wait]
momei ai generate-cover <postId> --prompt "..." [--wait]
momei ai generate-audio <postId> --voice <voice> [--wait]
momei ai task <taskId>
momei publish <postId>
```

CLI 约束：

- 长任务默认立即返回 `taskId`。
- `--wait` 采用轮询模式，适合 CI、脚本和一次性自动化场景。
- 输出应同时包含任务状态与最终回填结果摘要，避免用户必须二次解码原始 JSON。

### 6.2 MCP

首轮新增工具：

- `suggest_titles`
- `recommend_tags`
- `translate_post`
- `generate_cover_image`
- `generate_post_audio`
- `get_ai_task`

MCP 约束：

- 工具返回值尽量保持扁平、可由 LLM 直接消费。
- 长任务不在单次工具调用内阻塞等待。
- 已有文章 CRUD / 发布工具继续保留，自动化工具不重复实现相同写操作。

## 7. 服务端工作流约束 (Server Workflow Constraints)

### 7.1 翻译自动化

- 先校验源文章访问性与目标语言合法性。
- 使用统一 AI 任务实体落盘，并异步执行翻译。
- 标题、摘要、正文分别按站内既有能力翻译，避免重新发明 prompt 口径。
- 分类按翻译簇或 slug 回退匹配；标签按 `tagBindings` 与翻译建议收敛。
- 若提供目标文章，则执行更新；否则创建目标语言译文文章。

### 7.2 媒体自动化

- 图片生成成功后自动写回 `post.coverImage`。
- TTS / 播客任务完成后自动写回文章音频字段。
- 所有回填都必须保留原任务记录，方便后续审计与失败排查。

## 8. 测试与验证建议 (Validation Plan)

首轮至少覆盖：

- CLI API 包装层定向测试，确认自动化接口路径与返回值映射正确。
- MCP 工具契约测试，确认工具注册与关键处理器调用路径正确。
- 关键长任务的状态查询链路测试，确认 `taskId -> 查询 -> 完成/失败` 可追踪。

后续增强方向：

- 增加整篇翻译服务的更细粒度单元测试。
- 增加外部自动化 API 的集成测试与异常路径测试。
- 增加针对人工确认与失败恢复的端到端验证。

## 9. 风险与后续迭代 (Risks & Follow-ups)

- 整篇翻译工作流仍是本轮最复杂的编排点，后续应优先增加失败恢复与部分范围重试测试。
- taxonomy 翻译建议当前以“复用现有事实源优先，模型建议兜底”为原则，后续可继续增强批量确认机制。
- 若后续引入真正的批量编排场景，应单独设计批处理任务模型，而不是继续堆叠单文章长任务。

---
> 关联实现: `server/api/external/ai/*`、`server/services/ai/post-automation.ts`、`packages/cli/`、`packages/mcp-server/`
