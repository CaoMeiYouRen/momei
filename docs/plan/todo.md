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
- [ ] **Feed 协议兼容性补强**
    - [ ] 对现有 Atom 1.0 / JSON Feed 1.1 输出做阅读器兼容性回归验证并修正边界问题

### 4. ASR 性能与体验极限优化 (Extreme ASR Performance) (P1)
- [ ] **前端极速转录方案**
    - [ ] 实现前端直连 AI 厂商 (SiliconFlow/Volcengine) 的签名认证机制，绕过后端转发瓶颈
    - [ ] 实现前端音频压缩的分级策略（优先轻量方案，Wasm 方案作为可选增强）
- [ ] **异步任务流系统**
    - [ ] 实现针对大文件 ASR 的长时间任务轮询与前端状态推送（优先无 Redis 依赖方案）


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

