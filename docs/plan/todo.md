# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

## 第八阶段：生态能力收敛与协议落地 (Ecosystem Convergence & Protocol Delivery) (进行中)

> **当前阶段**: Phase 8
> **核心目标**: 聚焦现有 Web 架构内的能力收敛，完成系统配置闭环、商业化投放基础、开放协议最小可用落地，并推进 ASR 性能增量优化。

### 1. 系统配置深度解耦与统一化 (System Config Unification) (P1)
- [ ] **配置加载层重构**
    - [ ] 设计支持 `ENV` 优先、`DB` 补偿、`Default` 兜底的三层配置加载逻辑
    - [ ] 完成 `Better-Auth` 动态配置改造可行性收敛（短期维持 ENV 锁定，输出可实施替代方案）
- [ ] **系统设置 UI 增强**
    - [ ] 完善“智能混合模式”标识，明确提示哪些配置已被环境变量锁定 (Read-only in UI)
    - [ ] 增加配置项变更审计日志，记录管理员操作历史

### 2. 商业化与广告联盟集成 (Commercial & Ad Networks) (P1)
- [x] **多平台广告系统接入**
    - [x] 实现 Google AdSense 自动广告与手动 Slot 注入逻辑，支持在文章中间或末尾动态展示
    - [x] 实现百度、腾讯等国产广告联盟的接入，支持按 Locale (zh-CN) 定向显隐
- [x] **商业与投放管理 (Ad/Link Management)**
    - [x] 实现站内商业内容管理，支持全局/按分类/按标签注入广告占位符
    - [x] 实现外链安全过滤与跳转页 (Redirect Gate)，提升商业点击的可追踪性

### 3. 开放发布协议支持 (Open Federation - Phase I) (P2)
- [ ] **ActivityPub 基础骨架 (Foundation)**
    - [ ] 实现项目的 WebFinger 发现逻辑 (`/.well-known/webfinger`)
    - [ ] 设计并实现 ActivityPub Actor 路由与基础对象输出 (Post -> Note)
- [ ] **Feed 协议兼容性补强**
    - [ ] 对现有 Atom 1.0 / JSON Feed 1.1 输出做阅读器兼容性回归验证并修正边界问题

### 4. ASR 性能与体验极限优化 (Extreme ASR Performance) (P1) ✅
- [x] **Phase 1: 前端直连签名认证**
    - [x] 创建 ASR 类型定义 (`types/asr.ts`)
    - [x] 创建凭证生成工具 (`server/utils/ai/asr-credentials.ts`)
    - [x] 创建凭证颁发 API (`server/api/ai/asr/credentials.post.ts`)
    - [x] 创建前端直连 Composable (`composables/use-asr-direct.ts`)
- [x] **Phase 2: 音频压缩优化**
    - [x] 创建音频压缩工具 (`utils/audio-compression.ts`)
    - [x] 实现轻量级 PCM 重采样策略
- [x] **Phase 3: 异步任务支持**
    - [x] 扩展 ASR 服务异步任务方法 (`server/services/ai/asr.ts`)
    - [x] 创建异步转录 API 端点 (`server/api/ai/asr/transcribe/async.post.ts`)
    - [x] 创建任务追踪 Composable (`composables/use-asr-task.ts`)
    - [x] 修复 AIBaseService 支持可选 payload 和 progress
- [x] **Phase 4: 集成与测试**
    - [x] 集成直连模式到语音编辑器 (`composables/use-post-editor-voice.ts`)
    - [x] 编写 ASR 凭证工具单元测试 (`tests/server/utils/ai/asr-credentials.test.ts`)

### 5. Serverless 生态深度适配 (Serverless Ecosystem Integration) (P2) ✅
- [x] **核心安全增强**
    - [x] 创建 Webhook 安全校验工具 (`server/utils/webhook-security.ts`)
        - HMAC-SHA256 签名生成与验证
        - 时间戳防重放攻击 (5 分钟容差)
        - 时序安全比较 (timingSafeEqual)
    - [x] 重构 Webhook API 接口 (`server/api/tasks/run-scheduled.post.ts`)
        - 修复 Bug: 调用 `processScheduledTasks()` 替代 `processScheduledPosts()`
        - 新增 HMAC 签名验证模式
        - 保留简单 Token 模式 (向后兼容)
- [x] **平台原生配置**
    - [x] 更新 Vercel Cron Jobs 配置 (`vercel.json`)
    - [x] 更新 Cloudflare Scheduled Events 配置 (`wrangler.toml`)
    - [x] 创建 Cloudflare 内部触发处理器 (`server/routes/_scheduled.ts`)
- [x] **配置与文档更新**
    - [x] 更新 Runtime Config (`nuxt.config.ts`)
    - [x] 更新环境变量文档 (`.env.example`, `.env.full.example`)
    - [x] 更新设计文档 (`docs/design/modules/scheduled-publication.md`)
- [x] **测试覆盖**
    - [x] 编写 Webhook 安全校验单元测试 (25 个测试用例全部通过)
    - [x] API 集成测试 (通过 Lint 检查)


---

> **说明**: 长期规划与积压项已统一迁移至 [项目计划](./roadmap.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [roadmap.md](./roadmap.md) 中添加。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

