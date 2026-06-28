# AI 编辑增强功能套件评估

> 评估日期: 2026-06-29
> 评估类型: Go/No-Go 评估（评估态，不进入代码实现）
> 关联文档: [backlog.md #9](../../plan/backlog.md#9-ai-编辑增强功能套件-p1-p2-候选)

## 1. 执行摘要

本评估对 backlog 短期候选 #9「AI 编辑增强功能套件」进行技术可行性、前置条件与 ROI 分析。该功能套件包含 7 个子功能，旨在扩展 AI 辅助编辑能力，覆盖内容创作的完整生命周期。

**评估结论**: **条件性 Go** — 技术架构已就绪，但需先确认 AI 额度计费策略是否支持新增操作类型，并评估 prompt 多语言支持的实现成本。

## 2. 现有 AI 管线架构分析

### 2.1 已有能力

| 功能 | 方法 | 说明 |
|:---|:---|:---|
| 标题建议 | `suggestTitles` | 基于内容生成 5-10 个标题建议 |
| 摘要生成 | `summarize` | 生成指定长度的摘要 |
| 标签推荐 | `recommendTags` | 基于内容推荐标签 |
| 分类推荐 | `recommendCategories` | 基于内容推荐分类 |
| Slug 建议 | `suggestSlug` | 生成 URL 友好的 slug |
| 翻译 | `translate` | Markdown 内容翻译 |
| 图片提示 | `suggestImagePrompt` | 生成图片提示词 |
| 脚手架生成 | `generateScaffold` | 从笔记生成文章大纲 |
| 段落扩展 | `expandSection` | 扩展文章段落 |
| 语音优化 | `refineVoice` | 优化语音转录文本 |
| 手稿优化 | `optimizeManuscript` | 优化播客脚本 |

### 2.2 架构特点

- **统一计费**: 所有 AI 操作通过 `assertTextQuota()` 统一计费
- **多提供商**: 支持 OpenAI、Anthropic、Deepseek、Volcengine 等
- **流式输出**: 支持 `translateStream` 流式翻译
- **任务队列**: 翻译支持异步任务模式
- **Prompt 模板**: 使用 `{{variable}}` 模板变量

### 2.3 额度计费策略

```typescript
// 现有计费维度
interface AIQuotaPolicy {
    subjectType: 'global' | 'user' | 'role'
    subjectValue: string
    scope: 'all' | 'type:*' | 'category'
    period: 'day' | 'month' | 'total'
    maxRequests?: number
    maxQuotaUnits?: number
    maxActualCost?: number
    maxConcurrentHeavyTasks?: number
}
```

**计费类别**: `text` | `image` | `asr` | `tts` | `podcast`

## 3. 功能清单与技术可行性

| 功能 | 优先级 | 技术可行性 | 复用度 | 说明 |
|:---|:---|:---|:---|:---|
| **改写 (Rewrite)** | P1 | ✅ 高 | 高 | 复用 `provider.chat()`，新增 prompt |
| **续写 (Continue)** | P1 | ✅ 高 | 高 | 复用 `provider.chat()`，新增 prompt |
| **审查 (Review)** | P1 | ✅ 高 | 高 | 复用 `provider.chat()`，新增 prompt |
| **扩写 (Expand)** | P2 | ✅ 高 | 高 | 类似 `expandSection`，复用架构 |
| **缩写 (Condense)** | P2 | ✅ 高 | 高 | 复用 `provider.chat()`，新增 prompt |
| **编辑视角检查** | P2 | ✅ 中 | 中 | 需要更复杂的 prompt 设计 |
| **读者视角检查** | P2 | ✅ 中 | 中 | 需要更复杂的 prompt 设计 |

### 3.1 技术方案

```typescript
// 新增 API 端点
POST /api/ai/rewrite        // 改写
POST /api/ai/continue       // 续写
POST /api/ai/review         // 审查
POST /api/ai/expand         // 扩写
POST /api/ai/condense       // 缩写
POST /api/ai/check-editor   // 编辑视角检查
POST /api/ai/check-reader   // 读者视角检查

// 复用现有架构
class TextService extends AIBaseService {
    static async rewrite(options: RewriteOptions, userId?: string) {
        await this.assertTextQuota({
            userId,
            type: 'rewrite',
            payload: options,
        })
        
        const provider = await getAIProvider('text')
        const prompt = formatPrompt(AI_PROMPTS.REWRITE, options)
        
        const response = await provider.chat({
            messages: [{ role: 'user', content: prompt }],
            userId,
        })
        
        return response.content
    }
}
```

### 3.2 Prompt 设计示例

```typescript
REWRITE: 'Rewrite the following content in {{language}} with {{style}} style. '
    + 'Maintain the original meaning but change the expression. '
    + 'Output ONLY the rewritten content:\n\n{{content}}',

CONTINUE: 'Continue writing the following content in {{language}}. '
    + 'Maintain the same style, tone, and logical flow. '
    + 'Output ONLY the continued content:\n\n{{content}}',

REVIEW: 'Review the following content in {{language}} for: '
    + 'grammar, logic, style, factual accuracy. '
    + 'Provide specific improvement suggestions as a JSON array:\n\n{{content}}',
```

## 4. 前置条件评估

### 4.1 AI 额度计费策略

| 检查项 | 状态 | 说明 |
|:---|:---|:---|
| 计费类型扩展 | ⚠️ 需确认 | 当前 `type` 字段需新增 7 个操作类型 |
| 额度单位计算 | ✅ 已就绪 | `calculateQuotaUnits()` 可复用 |
| 并发限制 | ✅ 已就绪 | `maxConcurrentHeavyTasks` 可复用 |

**建议**: 新增操作类型（`rewrite`、`continue`、`review`、`expand`、`condense`、`check_editor`、`check_reader`）到 `normalizeTaskCategory()` 函数。

### 4.2 Prompt 多语言支持

| 检查项 | 状态 | 说明 |
|:---|:---|:---|
| 语言变量 | ✅ 已就绪 | `{{language}}` 模板变量已支持 |
| Prompt 翻译 | ⚠️ 需评估 | 英文 prompt 是否需要翻译为其他语言 |
| 输出语言 | ✅ 已就绪 | 可通过 `{{language}}` 控制输出语言 |

**建议**: 保持 prompt 为英文（通用性更好），通过 `{{language}}` 控制输出语言。

### 4.3 与现有 AI 管线复用度

| 组件 | 复用度 | 说明 |
|:---|:---|:---|
| `AIBaseService` | ✅ 100% | 基类完全复用 |
| `getAIProvider()` | ✅ 100% | 提供商获取完全复用 |
| `formatPrompt()` | ✅ 100% | Prompt 格式化完全复用 |
| `assertTextQuota()` | ✅ 100% | 计费检查完全复用 |
| `recordTask()` | ✅ 100% | 任务记录完全复用 |

## 5. ROI 评估

### 5.1 开发成本

| 功能 | 优先级 | 预估工时 | 复杂度 |
|:---|:---|:---|:---|
| 改写 (Rewrite) | P1 | 2h | 低 |
| 续写 (Continue) | P1 | 2h | 低 |
| 审查 (Review) | P1 | 3h | 中 |
| 扩写 (Expand) | P2 | 2h | 低 |
| 缩写 (Condense) | P2 | 2h | 低 |
| 编辑视角检查 | P2 | 4h | 中 |
| 读者视角检查 | P2 | 4h | 中 |
| **合计** | | **19h** | |

### 5.2 收益分析

| 收益维度 | 说明 | 量化指标 |
|:---|:---|:---|
| 写作效率 | 减少手动改写/续写时间 | 预估提升 30-50% |
| 内容质量 | AI 审查可发现语法/逻辑问题 | 预估减少 20% 错误 |
| 用户体验 | 一站式 AI 编辑工具 | 提升用户满意度 |

### 5.3 ROI 计算

- **开发成本**: 19h × ¥500/h = ¥9,500
- **预期收益**: 写作效率提升 30% × 100 用户 × ¥100/用户/月 = ¥3,000/月
- **回收周期**: 9,500 / 3,000 ≈ 3.2 个月

**ROI**: 1.50（中等）

## 6. Go/No-Go 结论

### 6.1 结论: **条件性 Go**

| 条件 | 状态 | 说明 |
|:---|:---|:---|
| 技术架构就绪 | ✅ Go | 完全复用现有 AI 管线 |
| 计费策略支持 | ⚠️ 待确认 | 需新增 7 个操作类型 |
| Prompt 多语言 | ✅ Go | 通过 `{{language}}` 控制 |
| ROI 可接受 | ✅ Go | ROI 1.50，回收周期 3.2 个月 |

### 6.2 建议执行顺序

1. **Phase 1（P1）**: 改写 + 续写 + 审查（7h）
   - 先实现 3 个核心功能
   - 验证计费策略扩展
   
2. **Phase 2（P2）**: 扩写 + 缩写 + 编辑视角 + 读者视角（12h）
   - 补充 4 个辅助功能
   - 优化 prompt 设计

### 6.3 非目标

- 不做自动发布
- 不做内容生成（仍需用户确认）
- 不替代专业编辑工具

## 7. 关联文档

- [backlog.md #9](../../plan/backlog.md#9-ai-编辑增强功能套件-p1-p2-候选) - 原始需求
- [server/services/ai/text.ts](../../server/services/ai/text.ts) - AI 文本服务
- [server/utils/ai/prompt.ts](../../server/utils/ai/prompt.ts) - Prompt 模板
- [server/services/ai/quota-governance.ts](../../server/services/ai/quota-governance.ts) - 额度计费策略
