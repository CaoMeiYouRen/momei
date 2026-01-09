---
name: context-analyzer
description: 分析项目上下文、Nuxt 3 结构和依赖项，用于规划和调试。
version: 1.0.0
author: GitHub Copilot
applyTo: "**/*.{ts,vue,json,md}"
---

# Context Analyzer Skill (上下文分析技能)

## 能力 (Capabilities)

-   **项目结构分析**: 理解 Nuxt 3 目录约定 (`server/api`, `components`, `pages`)。
-   **符号解析**: 定位组件、自动导入的可组合函数 (composables) 和 TypeORM 实体的定义。
-   **依赖检查**: 读取 `package.json` 以验证已安装的包和版本。

## 指令 (Instructions)

1.  **读取结构**: 使用目录列表工具了解布局，忽略 `node_modules` 和 `.output`。
2.  **识别 Nuxt 类型**: 将 `server/api` 识别为后端定义，将 `pages`/`components` 识别为前端。
3.  **追踪逻辑**: 广泛搜索符号定义，以理解数据如何在后端实体 (Entities) 和前端组件 (Components) 之间流动。
4.  **依赖项**: 在建议导入之前检查 `package.json` 以了解可用的库。

## 使用示例 (Usage Example)

输入: "分析当前的用户认证流程。"
动作: 读取 `server/api/auth/*`, `lib/auth-client.ts`, `middleware/auth.global.ts` 和 `pages/login.vue` 来映射流程。
