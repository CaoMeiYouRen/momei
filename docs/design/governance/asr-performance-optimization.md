# ASR 性能与体验优化 (ASR Performance & UX Optimization)

## 1. 概述

本文档只记录已经落地的 ASR 性能优化实现，不再保留与现状脱节的 FFmpeg.wasm、BullMQ 或 Redis 预案描述。

模块总览、驱动分类与治理边界请参考 [语音识别系统](../modules/asr.md)。

## 2. 前端直连凭证

### 2.1 凭证颁发接口

当前前端直连统一通过 [server/api/ai/asr/credentials.post.ts](../../server/api/ai/asr/credentials.post.ts) 获取临时凭证，特点如下：

- 仅允许管理员和作者角色调用
- 默认有效期 10 分钟，并支持通过 `ASR_CREDENTIAL_TTL_SECONDS` / `asr_credential_ttl_seconds` 调整
- 根据 `provider` 与 `mode` 返回不同厂商的连接信息

### 2.2 SiliconFlow 直连

SiliconFlow 当前采用短时 Bearer Token 直连模式：

- 返回 API Key、Endpoint 与模型名
- 前端直接向厂商转录接口提交表单数据
- 适合整段音频的批量转写

### 2.3 Volcengine 直连

Volcengine 当前采用 STS JWT + Query 鉴权模式：

1. 服务端使用 AppId 与 AccessKey 请求临时 JWT。
2. 返回 WebSocket Endpoint、鉴权 Query 参数与临时用户标识。
3. 前端通过 Query 参数建立 WebSocket 连接，不暴露永久密钥。

具体实现在 [server/utils/ai/asr-credentials.ts](../../server/utils/ai/asr-credentials.ts) 与 [composables/use-asr-direct.ts](../../composables/use-asr-direct.ts)。

## 3. 流式识别客户端

[composables/use-asr-direct.ts](../../composables/use-asr-direct.ts) 已经实现：

- 凭证提前续期与过期重取
- 基于 `expiresInMs` + 本地接收时间的时钟偏差缓冲
- Volcengine WebSocket 建连与首帧初始化
- 中间结果与最终结果拆分
- 流式链路在凭证失效或意外断开后的自动重连恢复
- 流结束时发送 final frame 并主动关闭连接

这意味着当前流式链路的重点已经不是“如何设计协议”，而是围绕真实厂商协议做浏览器端适配。

## 4. 轻量音频压缩

### 4.1 当前策略

项目当前没有接入 FFmpeg.wasm，而是采用浏览器原生能力做轻量压缩与重采样，核心实现位于 [utils/audio-compression.ts](../../utils/audio-compression.ts)。

当前策略如下：

- 优先探测 `audio/webm;codecs=opus`
- 其次回退到 `audio/webm`
- 最终回退到 PCM
- 使用 `OfflineAudioContext` 做单声道重采样
- 默认优先 16kHz，匹配 ASR 常见采样需求

### 4.2 当前收益

这一实现的目标不是极限压缩，而是：

- 不引入大体积 Wasm 依赖
- 在浏览器侧快速降采样
- 为直连流式与异步上传统一提供更适合识别的音频数据

## 5. 异步任务追踪

### 5.1 任务创建

[server/api/ai/asr/transcribe/async.post.ts](../../server/api/ai/asr/transcribe/async.post.ts) 已支持：

- 50MB 文件上限
- `audio/webm`、`audio/mp3`、`audio/wav`、`audio/mpeg`、`audio/ogg` 等格式校验
- 任务 ID 返回

### 5.2 服务端执行

[server/services/ai/asr.ts](../../server/services/ai/asr.ts) 当前会：

- 创建 AI 任务记录
- 异步执行转录
- 回写 `pending`、`processing`、`completed`、`failed` 状态
- 推送实时事件并发送站内通知

### 5.3 前端追踪

[composables/use-asr-task.ts](../../composables/use-asr-task.ts) 采用“双保险”策略：

- 优先连接现有通知 SSE 流
- 同时保留轮询兜底

因此当前任务追踪不依赖新增消息总线，也不依赖专用队列系统。

## 6. 当前边界

以下内容明确不属于当前已实现范围：

- FFmpeg.wasm 浏览器压缩链路
- BullMQ / Redis 异步队列
- 面向多租户的精细化 ASR 额度控制

这些方向若未来重新立项，应作为新阶段任务处理，而不是继续留在本阶段文档中造成误导。

## 7. 相关文档

- [语音识别系统](../modules/asr.md)
- [AI 辅助](../modules/ai.md)
