# 跨包复用治理评估：`packages/mcp-server` 与 `packages/cli`

## 1. 背景

`packages/mcp-server`（MCP 协议服务端，10 文件）和 `packages/cli`（命令行工具，15 文件）均为墨梅博客的外部工具客户端，面向同一套 `/api/external/*` REST 接口。当前两包**零 import 关系**，完全独立开发。本评估判断是否值得抽取共享包来收敛重复代码与 API 契约漂移风险。

## 2. 共享面规模

### 2.1 统计总览

| 类别 | 共享量 | 详情 |
|:---|:---|:---|
| API 方法 | 13 个相同端点的方法签名 | POST/GET/PATCH/DELETE 覆盖 posts、AI、TTS |
| 工具函数 | 3 个（行级等价） | `extractTagNames`、`getErrorMessage`、`normalizeAsciiSlug` |
| 类型定义 | 6 组同名概念独立定义 | 翻译参数、slug 策略、任务响应等 |
| 配置常量 | 4 组 | 默认 URL、API Key 变量名、版本号、Auth header 名 |
| **⚠️ 已知 Bug** | 1 个 | Auth header 名不一致：`X-API-Key` vs `X-API-KEY` |

### 2.2 最大重复面：API 客户端

两个类（`MomeiApi` vs `MomeiApiClient`）覆盖相同的 13 个端点，差异仅在传输层（`fetch` vs `axios`）和返回格式（`ApiEnvelope<T>` vs `{ code, data }`）。

| 端点 | mcp-server | cli | 是否重复 |
|:---|:---|:---|:---|
| `GET /api/external/posts` | `listPosts()` | — | — |
| `GET /api/external/posts/:id` | `getPost()` | `getPost()` | ✅ |
| `POST /api/external/posts` | `createPost()` | `createPost()` | ✅ |
| `PATCH /api/external/posts/:id` | `updatePost()` | — | — |
| `POST .../publish` | `publishPost()` | `publishPost()` | ✅ |
| `DELETE .../posts/:id` | `deletePost()` | — | — |
| `POST .../ai/suggest-titles` | ✅ | ✅ | ✅ |
| `POST .../ai/recommend-tags` | ✅ | ✅ | ✅ |
| `POST .../ai/recommend-categories` | ✅ | ✅ | ✅ |
| `POST .../ai/translate-post` | ✅ | ✅ | ✅ |
| `POST .../ai/image/generate` | ✅ | ✅ | ✅ |
| `POST .../ai/tts/task` | ✅ | ✅ | ✅ |
| `GET .../ai/tasks/:id` | ✅ | ✅ | ✅ |
| CLI 独有 (import/validate/governance) | — | 5 个 | — |

**结论**：13 个共享端点中，9 个方法签名在双方完全重复。CLI 是"超集"（多 5 个 CLI 独有端点），MCP 是"子集"。

### 2.3 工具函数重复

| 函数 | mcp-server | cli | 等价性 |
|:---|:---|:---|:---|
| `extractTagNames` / `extractExistingTagNames` | 私有函数，`automation.ts:7-22` | 导出函数，`cli-shared.ts:29-44` | **逐行相同** |
| `getErrorMessage` | `lib/error.ts`（独立模块） | 内联三处 | 逻辑一致 |
| `normalizeAsciiSlug` | — | `slug.ts`（独立模块） | CLI 独有 |

## 3. 抽包成本评估

### 3.1 新建共享包的代价

| 事项 | 工作量 | 风险 |
|:---|:---|:---|
| 创建 `@momei-blog/api-client` 共享包 | ~6-8h | **高**：需统一两套 HTTP 客户端的返回格式、错误处理、类型系统 |
| 创建 `@momei/shared-types` | ~2-3h | 低：纯类型导出 |
| 创建 `@momei/shared-utils` | ~1-2h | 低：3 个纯函数 |
| 修改 mcp-server 引用新共享包 | ~2-3h | 中：fetch→axios 迁移可能改变 MCP 运行时行为 |
| 修改 cli 引用新共享包 | ~2-3h | 低：主要是 import 重写 |
| 回归测试 | ~2h | 中：两个包各有测试，需确保不回归 |

**总计粗估**：15-21h（完整方案），或 5-8h（仅类型+工具函数方案）。

### 3.2 不抽包的替代方案

| 方案 | 工作量 | 效果 |
|:---|:---|:---|
| **A. 修复已知 Bug**（Auth header 对齐） | ~0.5h | 解决即时的生产风险 |
| **B. 内联代码对齐**（手动同步重复函数） | ~1h | 低维护，但未来仍会漂移 |
| **C. 仅创建 `@momei/shared-types` + `@momei/shared-utils`** | ~5-8h | 消除函数/类型重复，API 客户端仍各自维护 |
| **D. 完整方案**（含 `@momei-blog/api-client`） | ~15-21h | 根本性消除重复，但风险最高 |

## 4. 维度评估

| 维度 | 评分 (1-5) | 说明 |
|:---|:---|:---|
| **共享面规模** | 4 | 9 个 API 方法、3 个工具函数、6 组类型、4 组常量 —— 规模可观 |
| **漂移风险** | 4 | 已有 Auth header 不一致的潜伏 Bug；API 迭代时需手动同步两处 |
| **抽包复杂度** | 4 | 两套 HTTP 传输层（fetch/axios）和返回格式（envelope/direct）需统一，涉及运行时行为变更 |
| **现有独立性价值** | 3 | 两包分别适配 MCP SDK 和 cac CLI 框架，独立性有架构合理性 |

### 综合公式

$$Score = \frac{Value + Alignment}{Difficulty + Risk} = \frac{4 + 3}{4 + 4} = 0.88$$

（< 1.5 准入线，说明完整抽包方案的性价比在当前阶段不够高。）

## 5. 结论：No-Go（完整方案）/ 条件性 Go（轻量方案）

### 5.1 完整方案（含 `@momei-blog/api-client`）

**结论：No-Go**。Score 0.88 低于 1.5 准入线。核心原因是两包使用不同的 HTTP 传输层（`fetch` vs `axios`）和返回格式，统一需要运行时行为变更，风险与工作量不成比例于当前阶段的 ROI。

### 5.2 轻量方案（仅类型 + 工具函数 + Bug 修复）

**结论：条件性 Go**。以下三项可独立执行，不阻塞也不依赖完整抽包：

1. **P0 — 修复 Auth header Bug**：将 mcp-server 的 `X-API-Key` 对齐到 cli 的 `X-API-KEY`（或反之），避免生产环境认证失败（~0.5h）
2. **P1 — 创建 `@momei/shared-types`**：提取 6 组重复类型定义到共享类型包（~2-3h）
3. **P2 — 创建 `@momei/shared-utils`**：提取 `extractTagNames`、`getErrorMessage`、`normalizeAsciiSlug`（~1-2h）

### 5.3 后续重评触发条件

当满足以下任一条件时，重新评估完整方案：
- `/api/external/*` 端点新增 ≥5 个
- 出现第二个"只在其中一个包存在"的 API 行为漂移
- CLI 或 MCP Server 需要切换 HTTP 传输层（如统一到 `fetch`）

## 6. 建议进入下一阶段的行动项

| 优先级 | 行动 | 来源 | 建议阶段 |
|:---|:---|:---|:---|
| P0 | 修复 Auth header 不一致（`X-API-Key` vs `X-API-KEY`） | 本评估发现 | 当前或下一阶段 |
| P1 | 提取 `extractTagNames` 到 `@momei/shared-utils` | 本评估建议 | 后续阶段 |
| P1 | 提取 6 组重复类型到 `@momei/shared-types` | 本评估建议 | 后续阶段 |

## 7. 验证证据

- 源码全量扫描：`packages/mcp-server/src/`（6 源文件）+ `packages/cli/src/`（10 源文件）
- 交叉 import 搜索：零发现
- 重复函数对比：`extractTagNames`（逐行相同）、`getErrorMessage`（语义等价）
- Auth header: mcp-server `X-API-Key` ≠ cli `X-API-KEY`
