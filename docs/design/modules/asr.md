# 语音识别系统 (ASR System)

## 1. 概述

本文档是语音识别模块的主文档，只保留当前已经落地的能力总览、入口链路与治理边界。

前端直连凭证、轻量压缩、流式协议细节与异步任务追踪等优化实现，统一收敛到 [ASR 性能与体验优化](../governance/asr-performance-optimization.md)，避免两篇文档重复描述同一条链路。

## 2. 当前支持的识别模式

| 驱动 | 模式 | 说明 | 状态 |
| :--- | :--- | :--- | :--- |
| Web Speech API | 实时 | 浏览器原生识别，零服务端成本 | 已启用 |
| SiliconFlow | 批量 | 适合整段音频转写 | 已实现 |
| Volcengine | 流式 | 适合低延迟写作场景 | 已接入 |

## 3. 当前实现架构

### 3.1 前端入口

前端编辑器侧已经形成统一的 ASR 使用入口，底层按场景切换浏览器原生、直连批量和直连流式模式。

当前模块可以拆成三层：

- 录音与驱动切换
- 厂商临时凭证获取
- 同步转录或异步任务追踪

### 3.2 服务端职责

服务端目前承担的职责主要是：

- 颁发临时直连凭证
- 在需要时执行批量转录或异步任务创建
- 将用量、结果与异常写入 AI 任务审计数据

相关实现分布在：

- [server/api/ai/asr/credentials.post.ts](../../server/api/ai/asr/credentials.post.ts)
- [server/api/ai/asr/transcribe/async.post.ts](../../server/api/ai/asr/transcribe/async.post.ts)
- [server/services/ai/asr.ts](../../server/services/ai/asr.ts)

### 3.3 配置来源

ASR 配置已经接入系统设置服务，凭证生成会优先读取专用 ASR 设置，并在部分场景下回退到通用厂商设置。

以 Volcengine 为例，当前服务端会优先读取：

- `ASR_VOLCENGINE_APP_ID`
- `ASR_VOLCENGINE_ACCESS_KEY`
- `ASR_VOLCENGINE_CLUSTER_ID`
- `ASR_CREDENTIAL_TTL_SECONDS`

若未配置，再回退到通用火山引擎设置项。

## 4. 任务记录与治理边界

### 4.1 已落地的记录链路

无论是同步转录还是异步转录，当前都会把结果沉淀到 AI 任务体系中，用于：

- 成本观测
- 任务状态追踪
- 后台审计与通知

### 4.2 当前治理策略

当前阶段尚未引入“多用户精细化配额”体系，实际策略是：

- 继续限制单次文件大小与请求角色
- 通过 AI 任务记录做事后审计
- 将更细粒度的 AI 成本治理放入下一阶段规划

## 5. 相关实现文件

| 文件 | 说明 |
| :--- | :--- |
| [server/utils/ai/asr-credentials.ts](../../server/utils/ai/asr-credentials.ts) | 厂商临时凭证生成 |
| [composables/use-asr-direct.ts](../../composables/use-asr-direct.ts) | 前端直连能力 |
| [composables/use-asr-task.ts](../../composables/use-asr-task.ts) | 异步任务状态追踪 |
| [utils/audio-compression.ts](../../utils/audio-compression.ts) | 轻量音频压缩与重采样 |

## 6. 相关文档

- [ASR 性能与体验优化](../governance/asr-performance-optimization.md)
- [AI 辅助](./ai.md)
- [系统能力与设置](./system.md)
