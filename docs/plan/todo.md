# 墨梅 (Momei) 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

## 第七阶段：系统固化与多媒体进阶 (System Hardening & Multimedia Evolution) (进行中)

> **当前阶段**: Phase 7
> **核心目标**: 提升系统安全性与元数据管理深度，强化多媒体生产力并引入感官增强体验。

### 1. 播客全链路与多媒体进阶 (Podcast & Multimedia Evolution)
- [x] **文本转播客 (Text-to-Podcast) (P1)**
    - [x] 播客音频合成与元数据注入
    - [x] 火山引擎（Volcengine）TTS 接口对接与优化
    - [x] 火山引擎（Volcengine）播客专用模型接入与评测
- [x] **实时语音识别 (Real-time ASR) (P1)**
    - [x] 流式 ASR 控制器扩展 (支持 WebSocket/Chunks)
    - [x] 实时转录前端交互界面与低延迟显示

### 2. 系统固化与安全校验 (System Hardening & Security)
- [x] **全站权限深度审计 (P1)**
    - [x] API 路由鉴权逻辑全面核查
    - [x] 前端页面/组件访问可见性逻辑加固
    - [x] 数据层面权限隔离验证 (多角色/多租户模拟)
- [x] **元数据统一化管理 (P1)**
    - [x] 系统级元数据统一存储模型设计
    - [x] 稳健的 Metadata 局部更新 (Patch) 逻辑实现
    - [x] 分散字段（大纲、音频属性等）全量迁移与统一接管
- [x] **接口安全增强和漏洞修复 (P1)**
    - [x] 增强 api 的 zod 验证覆盖，特别是边界条件和异常输入
    - [x] 完成漏洞修复，确保 Dependabot alerts 没有 High 级别的未修复项
- [x] **修复 ajv 漏洞 (ReDoS) (P1)**
    - [x] 在 package.json 中添加 pnpm.overrides 强制升级 ajv 到安全版本
    - [x] 验证 lockfile 更新
- [ ] **Serverless ESM 依赖解析兼容修复 (P1)**
    - [ ] 回滚 `html-minifier` / Nitro externals 临时 workaround，恢复稳定基线
    - [ ] 定位 `mjml`/`lodash`/`htmlparser2` 在 Node ESM + Serverless 下的真实根因
    - [ ] 设计并验证最终方案（依赖替代或构建策略），避免再次出现 `ERR_MODULE_NOT_FOUND`

### 3. 感官体验增强 (Sensory Experience Enhancement)
- [ ] **看板娘系统 (Live2D) (P2)**
    - [x] Live2D 运行时集成与模型加载优化
    - [x] 基础交互行为（点击、闲置、跟随）实现
- [ ] **视觉增强特效 (P2)**
    - [ ] 可选视觉优化（背景粒子、平滑过渡动画等）
    - [ ] 性能平衡：在低端设备上自动降级/关闭特效

### 4. 性能基准与优化 (Performance & Optimization)
- [ ] **Lighthouse 红线机制 (P2)**
    - [ ] CI/CD 流程中集成 Lighthouse CI 审计
    - [ ] 配置核心页面性能红线（最低 90 分）
- [ ] **极限加载优化 (P2)**
    - [ ] Bundle 体积精算与依赖项裁剪
    - [ ] 关键路径渲染 (Critical Path) 深度调优

---

> **说明**: 长期规划与积压项已统一迁移至 [项目计划](./roadmap.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [roadmap.md](./roadmap.md) 中添加。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

