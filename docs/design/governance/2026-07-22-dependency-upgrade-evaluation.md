# 2026-07 依赖升级专项评估 — TypeScript 7 / ESLint 10

## 1. 背景

Dependabot 于 2026-07-20 自动提出两组大版本升级 PR：

| PR | Group | 升级内容 | 对应版本变化 |
|:---|:------|:---------|:------------|
| [#580](https://github.com/CaoMeiYouRen/momei/pull/580) | `typescript-checking` | TypeScript 6.0.3 → 7.0.2 | Major |
| [#580](https://github.com/CaoMeiYouRen/momei/pull/580) | `typescript-checking` | vue-tsc 3.3.6 → 3.3.7 | Patch（附带） |
| [#579](https://github.com/CaoMeiYouRen/momei/pull/579) | `eslint-stack` | ESLint 9.39.2 → 10.7.0 | Major |
| [#579](https://github.com/CaoMeiYouRen/momei/pull/579) | `eslint-stack` | eslint-config-cmyr 2.3.0 → 2.3.1 | Patch（附带） |
| [#579](https://github.com/CaoMeiYouRen/momei/pull/579) | `eslint-stack` | eslint-plugin-vue 10.9.2 → 10.10.0 | Minor（附带） |

两个 PR 的 CI 全部失败，经根因分析后 **均判定为 No-Go**。

---

## 2. PR #580 — TypeScript 7.0.2

### 2.1 结论：❌ 不升级

### 2.2 阻塞原因

| CI Job | 错误 | 根因 |
|:-------|:-----|:-----|
| Test (lint) | `TypeError: Cannot read properties of undefined (reading 'Cjs')` | `@typescript-eslint/typescript-estree@8.63.0` 无法解析 TypeScript 7.0 的模块格式 API |
| Build & Lighthouse | `[warn] TypeScript 7.0 does not yet have a stable API and is experimental` | tsdown / Rolldown 显式警告 TS 7 API 不稳定 |
| Unit / API Client / E2E / Coverage | `ENOENT: packages/mcp-server/dist/index.mjs` | 预构建缺失（已于 master 修复，与本次升级无关） |

### 2.3 核心风险

1. **生态未就绪**：`typescript-eslint` 当前最新版本为 8.65.0（含 8.65.1-alpha.x），但依然缺乏对 TypeScript 7 的正式支持声明。dependabot 的 `typescript-checking` group 本身包含 `typescript-eslint`，但本次升级并未将其纳入，说明上游亦无适配版本可用。
2. **API 不稳定**：TypeScript 7.0 官方标注为实验性（experimental），tsdown / Rolldown 在构建中显式警告部分选项不可用。
3. **无业务驱动力**：当前 TypeScript 6.x 运行正常，项目不依赖 TypeScript 7 的新特性。

### 2.4 等待条件

- `typescript-eslint` 发布正式支持 TypeScript 7 的版本，且纳入 `typescript-checking` group 统一升级。
- TypeScript 7 API 脱离实验性阶段。

---

## 3. PR #579 — ESLint 10.7.0

### 3.1 结论：❌ 不升级

### 3.2 阻塞原因

| CI Job | 错误 | 根因 |
|:-------|:-----|:-----|
| Test (lint) | `TypeError: sourceCode.getTokenOrCommentBefore is not a function` | `eslint-plugin-import@2.32.0` 的 `import/order` 规则调用了 ESLint 10 中移除的 API |
| Build & Lighthouse | `ENOENT: packages/mcp-server/dist/index.mjs` | 预构建缺失（已于 master 修复，与本次升级无关） |
| Unit / Other | 同上（预构建缺失导致的级联失败） | 与本次升级无关 |

### 3.3 核心风险

1. **插件不兼容**：`eslint-plugin-import@2.32.0` 的 peerDependencies 声明的最大 ESLint 版本为 `^9`，未声明支持 ESLint 10。`sourceCode.getTokenOrCommentBefore` 在 ESLint 10 中被移除，直接导致运行时崩溃。
2. **插件生态未跟进**：`eslint-plugin-import` 当前最新仍为 2.32.0，在上游发布兼容版本之前无法安全升级 ESLint。
3. **连锁影响**：即使跳过 `import/order` 规则，其他插件（`eslint-plugin-vue`、`@intlify/eslint-plugin-vue-i18n`、`@typescript-eslint/*`）对 ESLint 10 的兼容性也未经过本项目的完整验证。

### 3.4 等待条件

- `eslint-plugin-import` 发布支持 ESLint 10 的版本。
- 完成 ESLint 10 + 全量插件栈的最小验证矩阵。

---

## 4. 长期影响

| 依赖 | 当前版本 | 屏蔽版本 | 预期就绪窗口 | 备注 |
|:-----|:---------|:---------|:-------------|:-----|
| `typescript` | ^6.0.3 | >=7.0.0 | TS 7 stable + typescript-eslint 适配 | 不升级不阻塞业务 |
| `eslint` | ^9.39.2 | >=10.0.0 | eslint-plugin-import 发版 | 不升级不阻塞业务 |

两个升级均不属于安全更新，**等待生态就绪后再由 Dependabot 自动提案**。

---

## 5. 相关链接

- [Dependabot 配置](../../../../.github/dependabot.yml) — 已添加对应忽略规则
- [TypeScript 7 Release Notes](https://devblogs.microsoft.com/typescript/typescript-7-rc/)
- [ESLint 10 Migration Guide](https://eslint.org/docs/latest/use/migrating-to-10.0.0)
- [eslint-plugin-import #3019 — ESLint 10 compatibility](https://github.com/import-js/eslint-plugin-import/issues/3019)
