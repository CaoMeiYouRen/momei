# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

## 第八阶段：桌面端与生态扩展 (Desktop & Ecosystem Expansion) (进行中)

> **当前阶段**: Phase 8
> **核心目标**: 突破 Web 边界，完善多端同步，实现系统配置闭环并深度优化多媒体创作流性能。

### 1. 系统配置深度解耦与统一化 (System Config Unification) (P1)
- [ ] **配置加载层重构**
    - [ ] 设计支持 `ENV` 优先、`DB` 补偿、`Default` 兜底的三层配置加载逻辑
    - [ ] 实现在后台管理界面动态修改 `Better-Auth` 关键参数（如 OAuth Client ID/Secret）并热重载
- [ ] **系统设置 UI 增强**
    - [ ] 完善“智能混合模式”标识，明确提示哪些配置已被环境变量锁定 (Read-only in UI)
    - [ ] 增加配置项变更审计日志，记录管理员操作历史

### 2. 商业化与广告联盟集成 (Commercial & Ad Networks) (P1)
- [ ] **多平台广告系统接入**
    - [ ] 实现 Google AdSense 自动广告与手动 Slot 注入逻辑，支持在文章中间或末尾动态展示
    - [ ] 实现百度、腾讯等国产广告联盟的接入，支持按 Locale (zh-CN) 定向显隐
- [ ] **商业与投放管理 (Ad/Link Management)**
    - [ ] 实现站内商业内容管理，支持全局/按分类/按标签注入广告占位符
    - [ ] 实现外链安全过滤与跳转页 (Redirect Gate)，提升商业点击的可追踪性

### 3. 开放发布协议支持 (Open Federation - Phase I) (P2)
- [ ] **ActivityPub 基础骨架 (Foundation)**
    - [ ] 实现项目的 WebFinger 发现逻辑 (`/.well-known/webfinger`)
    - [ ] 设计并实现 ActivityPub Actor 路由与基础对象输出 (Post -> Note)
- [ ] **RSS/Atom 协议补完**
    - [ ] 完成对 Atom 1.0 和 JSON Feed 1.1 的全量支持，提升三方阅读器兼容性

### 4. ASR 性能与体验极限优化 (Extreme ASR Performance) (P1)
- [ ] **前端极速转录方案**
    - [ ] 实现前端直连 AI 厂商 (SiliconFlow/Volcengine) 的签名认证机制，绕过后端转发瓶颈
    - [ ] 实现前端音频本地压缩采样策略 (Wasm-based codec)，上传体积减小 50% 以上
- [ ] **异步任务流系统**
    - [ ] 实现针对大文件 ASR 的长时间任务轮询与前端 WebSocket 推送状态


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

