---
name: context-analyzer
description: 分析项目上下文、Nuxt 结构和依赖项，用于规划和调试。
metadata:
  internal: true
---

# Context Analyzer Skill (上下文分析技能)

## 能力 (Capabilities)

-   **项目结构分析**: 理解 Nuxt 目录约定 (`server/api`, `components`, `pages`) 以及 Nuxt 4 特性。
-   **符号解析**: 定位组件、自动导入的可组合函数 (composables) 和 TypeORM 实体的定义。
-   **认证流程分析**: 深入理解 Better-Auth 的集成，包括 `lib/auth.ts` (服务端), `lib/auth-client.ts` (客户端), `middleware/auth.global.ts` (全局中间件)。
-   **依赖检查**: 读取 `package.json` 以验证已安装的包和版本。
-   **Session 上下文恢复**: 读取 `.session/current-task.yaml` 等 session 级文件，快速恢复当前任务上下文、进度与认知状态。

## 指令 (Instructions)

1.  **读取结构**: 使用目录列表工具了解布局，忽略 `node_modules` 和 `.output`。
2.  **识别 Nuxt 类型**: 将 `server/api` 识别为后端定义，将 `pages`/`components` 识别为前端。
3.  **追踪逻辑**: 广泛搜索符号定义，以理解数据如何在后端实体 (Entities) 和前端组件 (Components) 之间流动。
4.  **身份验证感知**: 在处理受保护路由或用户数据时，务必检查 `server/api/auth/*` 和 `middleware/auth.global.ts`。
5.  **依赖项**: 在建议导入之前检查 `package.json` 以了解可用的库。
6.  **Session 上下文恢复**: 在分析项目上下文时，优先读取 `.session/current-task.yaml` 了解当前任务状态、进度与认知模式；若文件不存在，回退到只读 `docs/plan/todo.md` 获取阶段级上下文。

### 信息检索铁律：先分类再选工具

在分析上下文时，先判断信息需求类型，再选择正确工具。用错工具 = 信息召回失败。

| 信息类型 | 正确工具 | 用错后果 |
|:---|:---|:---|
| **精确字面量**（字段名、环境变量、API 路径） | `Grep` / `Glob` | 语义检索给出模糊候选，全错 |
| **跨词同义**（业务术语 ↔ 代码术语） | 先查 `docs/` 对照文档，后做语义关联 | `grep` 0 hits |
| **调用链 / 结构关系**（import 链、引用关系） | 追踪文件 `import` / `require` 关系 | 语义检索不理解语法 |
| **时间轴**（谁何时改、哪个 commit 引入） | `git log` / `git blame` | 其他工具无时间维度 |

原则：把规则告诉模型，让模型选工具；不要写代码替模型选。

## 使用示例 (Usage Example)

输入: "分析当前的用户认证流程。"
动作: 读取 `server/api/auth/*`, `lib/auth-client.ts`, `middleware/auth.global.ts` 和 `pages/login.vue` 来映射流程。
