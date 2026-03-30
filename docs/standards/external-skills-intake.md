# 外部 Skills 准入清单

本文档用于汇总当前允许作为“外部参考 skill”使用的首批候选项，并说明它们的来源、同步地址、更新频率、失效处理与转内部化门槛。项目内部维护的 Skills 仍以 `.github/skills/**/SKILL.md` 为主定义；外部 skill 只作为参考来源或调用入口，不进入项目内部库存。

> 唯一事实源：外部 skill 的结构化清单以 `.github/external-skills-registry.json` 为准。本文档只负责便于人工检索和审查；若两者不一致，应先修正 JSON，再同步本文。

## 1. 准入规则

1. 外部 skill 必须有清晰来源，且来源路径不得伪装成项目内部 `.github/` 或 `.claude/` 定义。
2. 外部 skill 只能作为参考来源、调用入口或能力补充，不得直接复制为长期镜像。
3. 当外部 skill 与项目规范冲突时，优先遵循 [AI 资产治理规范](./ai-governance.md)、[开发规范](./development.md) 与 [测试规范](./testing.md)。
4. 若某个外部 skill 连续多次被重复依赖，且需要补充项目特化约束，应评估是否转内部化，而不是长期靠人工记忆维持。

## 2. 首批候选

| ID | 适用范围 | 来源路径 | 同步地址 | 更新频率 | 失效处理 | 转内部化门槛 |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| `nuxt` | Nuxt 应用结构、server routes、useFetch、middleware、SSR / SSG 混合场景 | `%USERPROFILE%/.copilot/skills/nuxt/SKILL.md` | `%USERPROFILE%/.copilot/skills/nuxt/` | 每月一次，或 Nuxt 主版本 / skill 文本显著变化后复核 | 若本地 skill 缺失、描述过时或与当前 Nuxt 事实不符，则降级到官方文档与 Context7，不镜像入库。 | 当同类任务连续 3 次以上依赖该 skill 且需要补充项目特化规则时，转为内部 skill 或并入现有内部定义。 |
| `vue` | Vue 3 组件、组合式 API、宏语法、内置组件与响应式模型 | `%USERPROFILE%/.copilot/skills/vue/SKILL.md` | `%USERPROFILE%/.copilot/skills/vue/` | 每月一次，或 Vue 3 组合式 API 最佳实践发生明显变化后复核 | 若 skill 与项目既有 `<script setup lang="ts">` 规范冲突，则以项目规范和官方文档为准，不直接吸收入库。 | 当需要补充本项目 i18n、BEM、Nuxt 目录约束等项目特化内容时，合并进内部前端类 skill。 |
| `vue-best-practices` | Vue 代码风格审校、组合式 API 约束、TypeScript 与 SSR 兼容建议 | `%USERPROFILE%/.copilot/skills/vue-best-practices/SKILL.md` | `%USERPROFILE%/.copilot/skills/vue-best-practices/` | 每两个月一次，或 Volar / vue-tsc / Vue 官方推荐范式变化后复核 | 若建议与项目既有 Nuxt 约束重复或冲突，仅保留参考，不直接复制到仓库镜像。 | 当外部最佳实践需要稳定沉淀为本项目 Vue 编码准则时，优先并入 nuxt-code-editor 或 vue-frontend-expert。 |
| `vitest` | Vitest 定向运行、mock、coverage、fixture 与 Jest 兼容 API | `%USERPROFILE%/.copilot/skills/vitest/SKILL.md` | `%USERPROFILE%/.copilot/skills/vitest/` | 每月一次，或 Vitest 重大版本变更后复核 | 若外部 skill 的运行方式与本项目测试预算、目录规范冲突，则以测试规范和现有 test-engineer 为准。 | 当需要反复补充本项目的测试预算、目录约束和回归模板时，沉淀到内部 test-engineer references。 |
| `vitepress` | VitePress 站点配置、导航 / 侧边栏维护、Markdown 页面生成 | `%USERPROFILE%/.copilot/skills/vitepress/SKILL.md` | `%USERPROFILE%/.copilot/skills/vitepress/` | 每两个月一次，或文档站目录 / 主题配置出现结构性调整后复核 | 若外部 skill 未覆盖本项目 docs/i18n 重写规则或 sidebar 约束，则只作为补充参考。 | 当文档站改造频繁复用该 skill 且需要长期维护本项目 rewrites / sidebar 规则时，转为内部文档治理能力。 |
| `pnpm` | pnpm workspace、catalog / overrides、冻结安装、依赖管理与 lockfile 治理 | `%USERPROFILE%/.copilot/skills/pnpm/SKILL.md` | `%USERPROFILE%/.copilot/skills/pnpm/` | 每两个月一次，或 lockfile / workspace / overrides 策略调整后复核 | 若外部 skill 建议与本项目既有依赖审计、冻结安装或 workspace 约束不一致，则以项目脚本与安全规范为准。 | 当依赖治理、workspace 约束与发版前校验出现稳定复用需求时，沉淀到内部 devops-specialist 或治理脚本。 |

## 3. 维护动作

1. 新增外部候选时，先更新 `.github/external-skills-registry.json`，再同步本文。
2. 每次调整内部 Skills 或外部准入口径后，至少执行一次 `pnpm ai:check`。
3. 若发现文档描述与结构化清单不一致，应视为治理漂移，而不是“说明文字可晚点再补”。
