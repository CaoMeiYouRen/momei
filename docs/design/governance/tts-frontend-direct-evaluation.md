# TTS 前端直出评估与当前实现口径

## 1. 概述

### 1.1 背景

TTS 原始链路长期是“前端触发 -> 服务端调 Provider -> 流式读取 -> 服务端上传存储 -> 回写 Post 元数据”。这条链路在自部署环境下可行，但在 Vercel 这类 Serverless 运行时里，长文本 TTS 很容易撞上函数执行时长上限。

第三十四阶段的目标不是重写整个 `TTSService.processTask()`，而是在只对 Volcengine 开启前端直连的前提下，补出一条能够在 Serverless 环境落地的最小闭环：

```text
浏览器获取临时凭证 -> 直连 Volcengine TTS -> 浏览器拼接音频 -> 上传存储 -> 服务端回写 metadata / AITask
```

### 1.2 当前结论

当前仓库的真实结论已经不是“全部 Provider 都不能前端直连”，而是：

| Provider | 浏览器直连状态 | 当前口径 |
| :-- | :-- | :-- |
| OpenAI | 不支持 | 继续走服务端 TTS |
| SiliconFlow | 不支持 | 继续走服务端 TTS |
| Volcengine speech | 已支持 | 浏览器通过临时 JWT 直连 HTTP 单向流式接口 |
| Volcengine podcast | 已支持 | 浏览器通过临时 JWT + WebSocket 直连播客接口 |

根因不是简单的 CORS 开关，而是鉴权模型是否允许把“短期、受限、可撤销”的令牌下发给浏览器。当前只有 Volcengine 这条链路已经通过 `POST /api/ai/tts/credentials` 实现了这一点。

## 2. 运行时分流

### 2.1 内部管理端入口

管理端文章 TTS 对话框通过 [composables/use-post-tts-dialog.ts](../../../composables/use-post-tts-dialog.ts) 统一做模式分流：

1. `provider !== volcengine` 时继续走 `POST /api/ai/tts/task` + `use-tts-task.ts` 轮询。
2. `provider === volcengine` 时直接切到 [composables/use-tts-volcengine-direct.ts](../../../composables/use-tts-volcengine-direct.ts)。
3. 直连模式同时覆盖 `speech` 和 `podcast`，不再只停留在 HTTP speech 原型。

### 2.2 服务端任务入口

[server/api/ai/tts/task.post.ts](../../../server/api/ai/tts/task.post.ts) 与 [server/api/external/ai/tts/task.post.ts](../../../server/api/external/ai/tts/task.post.ts) 现在都共享同一条降级判定：

- 当运行时是 Serverless，或显式设置 `TTS_FRONTEND_DIRECT=true`
- 且 Provider 是 `volcengine`（或未显式传入，默认落到 Volcengine）

两条入口都会返回：

```json
{
  "strategy": "frontend-direct",
  "provider": "volcengine",
  "mode": "speech|podcast",
  "estimatedCost": 0,
  "estimatedQuotaUnits": 0,
  "message": "..."
}
```

这意味着：

- 管理端 UI 可以完全绕过后台长任务。
- API Key 调用方也不会因为还在打外部 API 而掉回旧的服务端超时链路。
- 自部署 / 非 Serverless 环境仍保留后台任务链路作为默认口径。

## 3. Volcengine 直连链路

### 3.1 临时凭证

[server/api/ai/tts/credentials.post.ts](../../../server/api/ai/tts/credentials.post.ts) 调用 [server/utils/ai/tts-credentials.ts](../../../server/utils/ai/tts-credentials.ts) 为前端签发短期凭证：

- speech: 浏览器通过 `X-Api-Access-Key: Jwt; <token>` 访问 HTTP TTS 接口
- podcast: 浏览器通过 URL Query 传入同一份 JWT，建立 WebSocket 连接
- TTL 由 `TTS_CREDENTIAL_TTL_SECONDS` 控制，默认 10 分钟

### 3.2 协议复用

当前 Volcengine 二进制协议相关逻辑已经做了分层：

- [utils/shared/volcengine-protocol.ts](../../../utils/shared/volcengine-protocol.ts)
  负责浏览器 / Node 都可复用的帧头、事件帧、错误帧、序列化解析。
- [server/utils/ai/volcengine-protocol.ts](../../../server/utils/ai/volcengine-protocol.ts)
  在共享 helper 之上补 Node 侧 `gzip` 解压与 Buffer 适配。

这样做的原因是：

1. 浏览器端的播客 WebSocket 不再需要维护一套“看起来像服务端协议、但细节已经漂了”的私有实现。
2. 服务端 provider 仍能保留 Node 侧的压缩处理能力。
3. 后续若继续收敛 ASR / TTS 的 Volcengine 帧协议，优先在 shared helper 层演进，而不是再复制第三套。

### 3.3 前端合成与上传

[composables/use-tts-volcengine-direct.ts](../../../composables/use-tts-volcengine-direct.ts) 当前链路如下：

1. 拉取临时凭证。
2. speech 模式直调 Volcengine HTTP 单向流式接口。
3. podcast 模式通过共享协议 helper 构建 / 解析 WebSocket 帧。
4. 浏览器拼接音频字节并生成 `File`。
5. 调用 [composables/use-upload.ts](../../../composables/use-upload.ts) 上传。
6. 调用 `PATCH /api/posts/:id/tts-metadata` 回写 metadata 与 AITask。

上传路径现在会按文章上下文收敛：

- 有 `postId` 时：`posts/<postId>/audio/tts/`
- 无 `postId` 时：`audio/tts/`

这避免了前端直连上传继续落到通用 `audio/` 目录，与服务端 `TTSService` 的文章音频收纳口径脱节。

## 4. 存储链路与本地存储边界

### 4.1 对象存储

当 `STORAGE_TYPE=s3` 或 `STORAGE_TYPE=r2` 时：

- `POST /api/upload/direct-auth` 返回 `put-presign`
- 浏览器直接 `PUT` 到对象存储
- 这是“前端合成 + 前端直传 OSS” 的完整口径

### 4.2 本地存储 / 非 S3 驱动

当 `STORAGE_TYPE=local` 或当前驱动不支持预签名 PUT 时：

- `POST /api/upload/direct-auth` 会返回 `strategy: proxy`
- 浏览器端仍然负责 TTS 合成
- 但上传这一步会回退到服务端 `/api/upload`

这意味着“前端语音合成 + 后端本地文件存储”是支持的，只是它是混合模式，而不是纯浏览器直传：

```text
浏览器直连 TTS -> 浏览器生成 File -> 服务端代理写入 local storage
```

补充约束：

- 在真正的 Serverless 平台上，不建议把 `STORAGE_TYPE` 留在 `local`，因为本地文件系统通常不可持久化。
- 在传统自部署环境里，`local` + 前端 TTS 是可工作的，只是上传段会多一次服务端中转。

## 5. Metadata 与 AI 任务落盘

[server/api/posts/[id]/tts-metadata.patch.ts](../../../server/api/posts/%5Bid%5D/tts-metadata.patch.ts) 现在承担两件事：

1. 回写 `Post.metadata.audio` 与 `Post.metadata.tts`
2. 记录一条已完成的 `tts_direct` / `podcast_direct` 任务，用于 AI 统计和审计

当前已经与服务端完成态共用同一套 metadata 构造逻辑 [server/utils/ai/tts-post-metadata.ts](../../../server/utils/ai/tts-post-metadata.ts)，避免两条链路继续出现字段漂移。

回写字段至少覆盖：

- `audio.url`
- `audio.size`
- `audio.duration`
- `audio.mimeType`
- `audio.language`
- `audio.translationId`
- `audio.postId`
- `audio.mode`
- `tts.provider`
- `tts.voice`
- `tts.duration`
- `tts.language`
- `tts.translationId`
- `tts.postId`
- `tts.mode`

对应的直连任务记录也会补齐：

- `audioDuration`
- `audioSize`
- `language`
- `quotaUnits`
- `actualCost`（当前按估算值落盘）

## 6. 保留的服务端链路

前端直连不是要替代整个后端 TTS 能力。

仍然保留服务端链路的场景：

- Provider 不是 Volcengine
- 自部署环境希望继续走统一后台任务
- 需要继续依赖 `media-task-monitor`、后台补偿与原有任务处理逻辑

[server/services/ai/tts.ts](../../../server/services/ai/tts.ts) 仍是后端唯一正式的 TTS 任务处理器。当前只是把“Volcengine 在 Serverless 环境下的高频超时问题”分流到浏览器侧解决，而不是推翻原始实现。

## 7. 当前非目标

- 不重写 `TTSService.processTask()`。
- 不把 OpenAI / SiliconFlow 强行改成浏览器直连。
- 不把图片生成链路一起改成前端直传。
- 不为 Serverless + `local` 这种组合背书为推荐部署方式。

## 8. 受影响文件

- [composables/use-post-tts-dialog.ts](../../../composables/use-post-tts-dialog.ts)
- [composables/use-tts-volcengine-direct.ts](../../../composables/use-tts-volcengine-direct.ts)
- [composables/use-upload.ts](../../../composables/use-upload.ts)
- [server/api/ai/tts/task.post.ts](../../../server/api/ai/tts/task.post.ts)
- [server/api/external/ai/tts/task.post.ts](../../../server/api/external/ai/tts/task.post.ts)
- [server/api/ai/tts/credentials.post.ts](../../../server/api/ai/tts/credentials.post.ts)
- [server/api/posts/[id]/tts-metadata.patch.ts](../../../server/api/posts/%5Bid%5D/tts-metadata.patch.ts)
- [server/utils/ai/tts-credentials.ts](../../../server/utils/ai/tts-credentials.ts)
- [server/utils/ai/volcengine-protocol.ts](../../../server/utils/ai/volcengine-protocol.ts)
- [utils/shared/volcengine-protocol.ts](../../../utils/shared/volcengine-protocol.ts)

## 9. 验收口径

当前这条能力链路最低要满足以下判断：

1. Serverless + Volcengine 时，内部和外部 TTS 任务入口都返回 `frontend-direct`。
2. 浏览器端能完成 speech / podcast 两种模式的 Volcengine 直连。
3. 有文章上下文时，上传路径落到文章音频目录，而不是通用 `audio/`。
4. `local` 存储驱动下，前端合成仍可工作，但上传应自动回退到服务端代理。
5. metadata 回写与服务端完成态字段口径一致，不再出现语言、translationId、duration、size 漏写。
