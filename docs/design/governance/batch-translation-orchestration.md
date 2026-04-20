# 文章批量翻译编排能力评估

## 1. 概述

第二十二阶段的这条主线不是从零发明“批量翻译”，而是评估当前仓库已经落地的单篇翻译、翻译簇、taxonomy 绑定、外部自动化入口与 AI 任务治理，是否足以支撑“多篇文章 -> 多个目标语言”的批量编排能力。

本评估的核心结论是：**允许进入最小可行开发，但只能在“复用现有单篇翻译工作流 + 增加批处理编排层”的边界内推进，不允许另起第二套翻译引擎、taxonomy 映射逻辑或任务状态模型。**

## 2. 准入结论

### 2.1 结论

- 该事项属于第二十二阶段的既有评估主线，本文现仅保留历史准入结论，不再作为当前待办入口。
- 允许进入下一步 MVP 设计与实现。
- 不允许直接把前端、CLI 或 MCP 中的“循环调用 `translate-post`”视为批量编排落地；那只会把单篇接口的偶发成功放大为不可控的并发扇出。

### 2.2 为什么可以准入

当前仓库已经具备批量编排所需的核心事实源：

- 单篇翻译工作流已经沉淀在 `PostAutomationService.createTranslatePostTask()` 与 `processTranslatePostTask()` 中，支持 `scopes`、`slugStrategy`、`categoryStrategy`、预览确认与目标文章续写 / 覆盖。
- 翻译簇已经统一收敛到 `translationId`，目标文章查找明确复用 `resolveTranslationClusterId()` 与 `findExistingTargetPost()`。
- 分类与标签映射已经有现成事实源：分类优先按翻译簇 / 建议候选回填，标签通过 `tagBindings` 保留源标签的翻译绑定，不需要批量场景重新猜测 taxonomy。
- 外部自动化入口已经统一到 `/api/external/ai/translate-post`、CLI `momei ai translate-post` 与 MCP `translate_post`，说明“站内服务是唯一执行层”这一分层已经成立。
- AI 长任务已经统一沉淀到 `AITask`，并带有 `payload`、`result`、`progress`、`estimatedQuotaUnits`、`quotaUnits`、`error` 等治理字段，可继续作为批量编排的状态事实源。

### 2.3 为什么不能直接开始堆循环

当前单篇翻译任务虽然已经异步化，但仍是“单文章、单目标语言”的任务模型。若直接在 UI、CLI 或 MCP 里把它成批扇出，会出现以下问题：

- 缺少批次级别的范围快照，任务开始后无法回答“本次到底选中了哪些文章 / 哪些目标语言”。
- 缺少批次级别的取消、失败重试、确认与汇总结果，用户只能逐个查看子任务。
- 缺少发布态保护，容易把“覆盖已发布译文”的高风险操作混进普通批量任务。
- 当前配额治理主要限制请求量、额度与高成本重任务并发，但文本翻译批量扇出仍可能把同一时刻的 LLM 并发拉得过高。

## 3. 可复用事实源

### 3.1 单篇翻译能力

现有单篇翻译工作流已经覆盖批量编排里最难的业务语义：

- 来源文章访问校验。
- 目标语言必须与源语言不同。
- 新建译文时强制包含 `title` + `content`。
- 目标文章自动续写：若同簇同语言目标版本已存在，则继续更新该版本。
- 预览确认：`confirmationMode=require` 只生成预览，`confirmationMode=confirmed + previewTaskId` 才会正式落库。

### 3.2 翻译簇与目标版本判定

批量编排必须沿用现有 `translationId` 语义，而不是再引入“批次自己的内容关联键”。当前已有约束：

- 源文章的翻译簇统一通过 `resolveTranslationClusterId(sourcePost.translationId, sourcePost.slug, sourcePost.id)` 收口。
- 目标文章查找优先命中“同一 `translationId` + 目标语言”。
- 后台编辑器当前已经能区分目标版本是 `missing`、`draft` 还是 `published`，并将动作归类为 `create`、`continue`、`overwrite`。

### 3.3 taxonomy 映射

批量编排必须复用现有 taxonomy 规则：

- 分类继续遵循 `cluster` / `suggest` 双策略，不再引入第三套分类映射逻辑。
- 标签继续通过 `tagBindings` 传递 `translationId`、`sourceTagSlug`、`sourceTagId`，服务层仍按“翻译簇 -> slug -> id”优先级匹配目标语言标签。
- 缺失目标语言 taxonomy 时，允许生成候选项或 warning，但不能静默解绑翻译簇。

### 3.4 任务状态模型

批量编排不能绕开 `AITask` 自建状态机。可复用的最小事实包括：

- `pending` / `processing` / `completed` / `failed` 四态。
- `payload` 记录输入参数，`result` 记录预览或落库结果。
- `estimatedQuotaUnits`、`quotaUnits`、`estimatedCost`、`actualCost` 可用于批次预算。
- `progress`、`error`、`failureStage` 可作为批次汇总的基础数据。

但需要额外说明的是：**批次条目的 `skipped`、`needs_confirmation`、`cancelled` 不能直接塞进当前全局 `AITaskStatus` 枚举。**

首轮建议口径：

- 根任务与子任务继续复用现有 `AITask` 四态：`pending` / `processing` / `completed` / `failed`。
- 批次级别的特殊语义不扩展为全局任务状态，而是编码在根任务 `result.items[]` 与 `result.summary` 中。
- 管理页与 API 查询根任务时，读取的是“根任务状态 + 条目 outcome 摘要”，而不是要求所有条目 outcome 都升级为顶层任务状态。

根任务状态归宿必须固定为：

- `pending` / `processing`：批次计划已创建，仍在派发或等待子任务收敛。
- `completed`：批次调度流程已经正常结束；即便其中包含 `skipped`、`needs_confirmation`、`cancelled` 或“部分完成”，也统一通过 `result.summary.finalDisposition` 区分，而不是把根任务顶层状态再扩展出新枚举。
- `failed`：只有根任务本身在计划构建、派发控制或汇总落盘阶段发生不可恢复错误，导致无法产出可信批次摘要时才使用。

也就是说，“已取消且部分完成”在首轮口径下表示：根任务 `status = completed`，但 `result.summary.finalDisposition = cancelled_partial`。

这样既满足“复用现有任务状态模型”，又避免为了首轮批量翻译把全站 AI 任务枚举一次性扩写到所有任务类型。

## 4. 边界评估

### 4.1 文章范围选择

首轮准入范围应限制为**显式选中的文章集合**，而不是“运行时动态查询条件”。

建议边界：

- 允许来源：后台文章管理页多选、CLI 显式 `postIds` 列表、或脚本侧先查询再传入确定的文章 ID 列表。
- 不允许首轮直接支持：按搜索关键字、分类、标签、时间窗口的“动态查询即执行”。
- 原因：动态查询会导致批次在重试、确认或补跑时漂移，无法保证本次批次的输入是可复现的。

因此，批次创建时必须先冻结一个**源文章快照清单**，最少包含：

- `sourcePostId`
- `sourceLanguage`
- `translationId`
- `sourceSlug`
- `resolvedClusterId`（按 `translationId -> slug -> id` 预先收敛）
- 当前目标语言版本状态摘要

这里的关键不是“是否有 `translationId`”，而是**是否冻结了与当前实现一致的翻译簇键**。对历史上 `translationId` 为空的文章，后续重试、确认与目标版本命中都必须继续沿用 `translationId -> slug -> id` 的现有回退链，而不是退化成“仅凭 `translationId` 判断”。

### 4.2 目标语言矩阵

目标语言矩阵应严格复用项目内部 `AppLocaleCode`，首轮只允许从 Locale Registry 中已启用的语言里选取。

规则：

- 目标语言必须排除源语言。
- 同一批次允许多个目标语言，但应在批次创建时冻结为显式数组。
- 对每个 `sourcePostId x targetLanguage` 组合先做目标状态预判：`missing`、`draft`、`published`。
- 这里的 `targetState` 是批量编排层的**三态归一化桶**，不是原始 `PostStatus` 全量枚举：`pending`、`hidden`、`rejected` 等未发布版本统一归到 `draft` 桶，`scheduled` 与 `published` 统一按“已上线或高风险覆盖面”处理。

推荐的首轮动作矩阵：

| 目标状态 | 默认动作 | 是否允许首轮直接执行 |
| :--- | :--- | :--- |
| `missing` | `create` | 是 |
| `draft` / `pending` / `hidden` / `rejected` | `continue` | 是 |
| `published` / `scheduled` | `skip` | 默认跳过；仅在显式确认后允许覆盖 |

### 4.3 预览确认

现有单篇工作流已经支持预览确认，批量编排必须在此基础上扩展，而不是改成不可逆黑盒。

首轮建议：

- 批次支持两种模式：
  - 自动落库：仅处理 `missing` 与非发布态目标版本。
  - 预览优先：先为每个条目生成预览，再由用户确认后应用。
- 对于已发布或高风险目标版本，必须强制进入预览确认流，不允许在批量自动模式里直接覆盖。
- 预览确认必须至少支持批次内“按条目确认”与“按条目跳过”，不能只有“全批通过 / 全批取消”。

### 4.4 失败重入与人工重试

批量编排首轮必须把失败重入当成一等能力，而不是依赖用户手动重新选一遍文章。

建议边界：

- 批次保存每个条目的执行结果与失败原因。
- 允许仅重试 `failed` / `skipped` / `needs_confirmation` 条目。
- 已 `completed` 条目默认不重跑，除非用户显式选择“覆盖已完成结果”。
- 若目标版本已经在批次运行期间被人工修改，重试前必须重新做目标状态判定，而不能沿用旧的“可覆盖”结论。

### 4.5 取消策略

当前代码没有为文本翻译任务持久化可恢复的 abort token，因此首轮取消能力只能做到：

- 停止继续派发未开始的条目。
- 已经进入 `translate_post` 的子任务允许自然完成。
- 根任务顶层 `status` 仍保持现有四态；当用户取消后，批次是否“已取消且部分完成”统一通过 `result.summary.finalDisposition` 表达，而不是新增全局任务状态。

## 5. 最小可行方案

### 5.1 总体方案

最小可行方案不应重写单篇翻译，而应新增一个**批次编排层**：

1. 创建批次计划。
2. 冻结来源文章与目标语言矩阵。
3. 为每个组合生成子任务输入。
4. 逐批派发既有 `translate_post` 子任务。
5. 汇总子任务状态，提供失败重试、确认与取消入口。

### 5.2 任务模型建议

首轮推荐继续复用 `AITask`，但补一层父子关系，而不是新增独立表：

- 根任务：`type = translate_post_batch`
- 子任务：继续使用现有 `type = translate_post`
- 建议新增：`parentTaskId`（可空）

这样可以做到：

- 后台 AI 任务页继续沿用同一套列表与详情页。
- 批次与子任务共用同一套状态、成本、额度与错误字段。
- 不需要额外维护第二套批处理状态表。

同时需要补一条批次结果约束：

- 根任务 `result.summary` 负责汇总 `completed`、`failed`、`skipped`、`needsConfirmation`、`cancelled` 数量。
- 根任务 `result.summary.finalDisposition` 负责表达批次收口语义，例如 `completed`、`completed_with_failures`、`cancelled_partial`、`confirmation_required`。
- 根任务 `result.items[]` 负责记录条目级 `outcome`，例如 `completed`、`failed`、`skipped`、`needs_confirmation`、`cancelled`。
- 子任务仍然只暴露现有四态，不把批次条目 outcome 反向污染为全局 AI 任务状态。

### 5.3 根任务 payload 建议

```ts
interface TranslatePostBatchPayload {
    sourcePostIds: string[]
    targetLanguages: string[]
    scopes: TranslationScopeField[]
    slugStrategy: 'source' | 'translate' | 'ai'
    categoryStrategy: 'cluster' | 'suggest'
    confirmationMode: 'auto' | 'require'
    overwritePublished: boolean
    dispatchPolicy: 'sequential' | 'bounded'
    sourceSnapshot: Array<{
        sourcePostId: string
        sourceLanguage: string
        translationId: string | null
        sourceSlug: string
        resolvedClusterId: string
        targets: Array<{
            language: string
            targetPostId: string | null
            targetState: 'missing' | 'draft' | 'published'
            plannedAction: 'create' | 'continue' | 'overwrite' | 'skip'
        }>
    }>
}
```

### 5.4 子任务 payload 复用方式

子任务继续复用现有 `TranslatePostTaskInput`，只增加批次上下文：

```ts
interface TranslatePostBatchChildPayload extends TranslatePostTaskInput {
    parentTaskId: string
    batchItemKey: string
}
```

这样可以确保：

- 单篇接口、CLI、MCP 和站内服务仍是唯一翻译事实源。
- 批量只是“谁来组织这些子任务”的问题，而不是“谁来重新定义翻译语义”的问题。

## 6. 配额、并发与超时结论

### 6.1 首轮预算口径

批量翻译首轮必须在创建批次前完成预算预估，至少汇总：

- 总条目数：`sourcePostIds.length x targetLanguages.length`
- 预估字符数：标题 + 摘要 + 正文 + taxonomy 名称
- 预估额度：汇总每个子任务的 `estimatedQuotaUnits`
- 预估成本：汇总每个子任务的 `estimatedCost`

若预估额度已经超过当前用户可用配额，根任务应在派发前直接失败，而不是先启动一半再在中途崩掉。

### 6.2 并发上限结论

当前文本翻译单任务内部已经使用分块并发，默认 `AI_TEXT_TASK_CONCURRENCY = 3`。因此批量层不能再无上限扇出子任务。

首轮建议结论：

- `dispatchPolicy = sequential`：预览确认模式默认使用，避免一次生成过多待确认预览。
- `dispatchPolicy = bounded`：自动模式可启用，但根任务同时派发的子任务数建议默认不超过 `2`。

理由：

- 单个子任务正文翻译已可能产生 3 路分块并发。
- 若批次层再并发 2 个子任务，等价于一次最多约 6 路文本翻译请求，仍处于可控区间。
- 再继续放大并发，收益不会线性增加，只会放大 provider 限流、配额冲击和错误恢复难度。

同时要明确当前治理缺口：现有 `maxConcurrentHeavyTasks` 只对 image / asr / tts / podcast 等 heavy 任务生效，**并不会自动约束 text 翻译批次**。因此若批量翻译进入实现，必须补一条 text 类派发守卫，不能误以为现有重任务并发门禁已经覆盖这条链路。

### 6.3 Serverless 超时预算结论

项目当前没有专门的外部队列；现有 AI 任务更多依赖应用进程内异步执行。因此批量翻译在 Serverless 环境下不能假设“一个请求内持续派发几十个子任务”是稳定的。

首轮结论：

- **不准入**“单请求内长时间调度完整批次”的实现。
- **准入**“根任务快速建档 + 小批次派发”的实现。
- 每次派发请求的目标是只完成计划冻结、配额检查与少量子任务创建，控制在短请求窗口内。

这意味着：

- 自托管 Node 环境可以逐步提高派发并发。
- Serverless 环境默认应采用更保守的 `sequential` 或 `bounded(1)` 派发策略。

## 7. 风险清单

### 7.1 高风险

- **发布态覆盖风险**：若把 `published` 目标版本默认纳入自动落库，极易造成误覆盖。
- **批次输入漂移**：若首轮允许动态查询直接执行，失败重试时将无法保证同一批次输入一致。
- **Serverless 不稳定性**：当前没有外部队列，长时间批量调度在 Serverless 环境中可靠性不足。

### 7.2 中风险

- **taxonomy 候选确认成本**：当分类映射依赖 `suggest` 且目标语言 taxonomy 不完整时，用户可能需要逐条确认。
- **配额突刺**：批次总量较大时，即便单任务可运行，也可能在短时间内耗尽当日额度。
- **部分成功后的认知复杂度**：若没有批次汇总视图，用户会难以判断哪些条目已成功、哪些只生成了预览。
- **text 并发守卫缺口**：当前配额治理并不会自动限制 text 类批量翻译的并发扇出，若不新增批次层守卫，默认 bounded(2) 也只是设计建议，不是运行时事实。

### 7.3 低风险

- **slug 策略不一致**：现有 `source` / `translate` / `ai` 三种 slug 策略已经稳定，批量场景只需统一传参。
- **标签复用错误**：只要继续强制走 `tagBindings`，该风险主要停留在历史脏数据层，而不是新批次本身。
- **CLI / MCP 漂移风险**：当前 CLI 与 MCP 仍只暴露单篇 `translate-post` 原子能力；批量能力若后续进入实现，必须先补独立批次契约、批次查询与调用边界，不能让调用方自行循环模拟批处理。

## 8. 不准入范围

以下能力不建议在首轮一并进入实现：

- 动态查询即执行的无限范围批量翻译。
- 自动覆盖所有已发布译文。
- 在首轮批量翻译里同时默认重建封面图与音频。
- 为批量场景新建完全独立于 `AITask` 的状态表与管理页。
- 在 MCP 中直接提供交互式逐条确认 UI。
- 在未定义独立批次契约前，直接让 CLI / MCP 通过循环单篇 `translate-post` 伪装批处理。

## 9. 建议的验证矩阵

若下一步进入实现，最低应补齐：

- 服务层单元测试：批次计划构建、目标状态分类、派发策略、失败重试。
- API 测试：批次创建、批次查询、按条目确认、按条目重试、取消。
- 定向集成测试：复用现有 `translate_post` 子任务，确认 `translationId`、`categoryStrategy` 与 `tagBindings` 未漂移。
- 后台交互验证：文章管理页多选 -> 创建批次 -> 查看汇总 -> 失败重试。
- CLI / MCP 契约测试：确认批量入口只是批次编排层，不绕开现有单篇翻译服务。

## 10. 下一步建议

如果继续推进实现，建议顺序如下：

1. 先补设计与契约：冻结根任务 payload、父子任务关系与批次查询响应。
2. 再做服务层最小实现：只支持“显式文章 ID + 目标语言数组 + 自动模式”。
3. 最后才扩展 UI、CLI 与 MCP 的批次操作面，并补逐条确认 / 重试交互。

---

关联文档：

- [AI 辅助功能模块](../modules/ai.md)
- [CLI / MCP 自动化能力扩展设计](./cli-mcp-automation.md)
- [国际化系统](../modules/i18n.md)
- [分类与标签聚合页设计](../modules/taxonomy.md)
