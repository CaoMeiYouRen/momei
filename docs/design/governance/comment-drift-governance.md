# 存量代码注释治理与注释漂移治理

## 1. 概述

第三十阶段的“存量代码注释治理与注释漂移治理 (P1)”继续沿长期主线推进，但本轮只冻结一个窄切片：候选组 A。

本轮不追求“注释数量增加”，而是围绕三条高复杂度链路补齐为什么这样写、跨层契约、边界条件与副作用说明，并同步删除已经退化成代码复述的低价值注释。

## 2. 本轮范围与非目标

### 2.1 执行范围

- 设置来源判定：`server/services/setting.ts`
- locale 归一化与认证边界映射：`server/utils/locale.ts`
- 请求级鉴权上下文挂载：`server/middleware/1-auth.ts`
- 请求级 i18n 上下文注入：`server/middleware/i18n.ts`

### 2.2 非目标

- 不扩写到上传存储解析、文章访问控制、AI 任务治理或公开查询裁剪链路。
- 不改动任何运行时行为、配置优先级、鉴权策略或 locale 解析顺序；本轮只做注释治理与漂移清理。
- 不把同类问题扩大为全仓“补齐所有导出函数注释”的平均铺量工程。

## 3. 选择这组链路的原因

- `setting.ts` 同时承载环境变量优先级、数据库回退、localized setting 旧值兼容、脱敏占位符保留与审计日志写入，是典型的跨层契约文件。
- `locale.ts` 需要在 Better Auth 的认证边界 locale、项目内部 `AppLocaleCode` 与浏览器 / Cookie / Header 输入之间做归一化，稍有误读就会引入事实源漂移。
- `1-auth.ts` 与 `i18n.ts` 虽然文件不长，但都位于请求入口层，负责“哪些请求值得解析会话 / locale”“上下文何时挂载到 event / AsyncLocalStorage”，属于容易被维护者误判的运行时边界。

## 4. 注释治理策略

本轮复盘后补充一条保留原则：注释治理并不等于“去掉函数前注释”。对于导出函数、复用工具函数和复杂函数，函数级说明仍然是高价值信息，但应优先收敛为简短 JSDoc，服务编辑器悬浮提示与跨文件复用，而不是保留只复述函数名和参数类型的空洞模板。

### 4.1 设置来源判定

- 重点解释 `env > db > default` 的优先级为何在读取层统一处理，而不是散落在调用方。
- 说明 localized setting 的解析顺序：结构化 locale 值优先，只有 fallback 链没有命中时才回退 legacy 单值。
- 说明 `setSettings()` 中“脱敏占位符保持旧值”和“删除 legacy alias key”的原因，避免后续把它误删成数据漂移或机密覆盖问题。
- 对 `getSetting()`、`getSettings()`、`getLocalizedSettings()`、`setSetting()`、`getAllSettings()` 与 `setSettings()` 这类导出入口，保留简短 JSDoc，说明读取/写入契约、来源决议与副作用边界，避免编辑器提示层只剩函数名。

### 4.2 locale 归一化

- 重点解释 auth boundary locale 与 app locale 的映射边界，以及为何 `default` 会折叠为项目内部英语默认值。
- 说明 `detectRequestAuthLocale()` 与 `getAuthLocaleFromRequest()` 维持同一优先级链的原因，避免 H3 与 Better Auth 两端口径分叉。
- 清理“语言代码映射表 / 标准化语言代码”这类复述式注释，改为描述历史兼容与边界约束。
- 对 `normalizeLocale()` 这类命名虽直接、但真实兼容面很宽的导出函数，保留简短 JSDoc，明确其别名归一化、前缀兜底与默认回退语义。

### 4.3 请求上下文挂载

- 重点解释 `shouldResolveSession()` 为什么对 `/api/auth` 始终开放，而对其余路径只在特定公开接口且存在会话痕迹时才触发，避免公开热点请求被无意义地拖入数据库与鉴权初始化。
- 说明 i18n 中间件为何同时写入 `event.context.locale` 与 `AsyncLocalStorage`，以及当前仅跳过内部构建产物与 favicon，而不是泛化成“所有静态资源都不进入链路”。

### 4.4 函数级 JSDoc 模板

本轮收口后，函数前注释统一优先参考简短 JSDoc，而不是自由发挥。目标是让编辑器悬浮提示、跨文件复用和 review 都能快速读到用途与边界，同时避免回到“把函数签名翻译一遍”的低价值模板。

#### 模板 A：导出复用函数

适用场景：被多个调用方复用的 `export` 函数，且名字不足以完整表达用途或返回语义。

```typescript
/**
 * 读取单个配置值。
 * 调用方拿到的是 env 优先、internal-only 隐藏后的最终可见值，不需要再重复决议来源。
 */
export async function getSetting(...) {
	...
}
```

要求：首句写“它做什么”，第二句只补调用方真正需要知道的来源优先级、过滤规则、fallback 或副作用边界。

#### 模板 B：复杂兼容函数

适用场景：函数名看得出大方向，但内部兼容面、回退链或协议边界较宽。

```typescript
/**
 * 将浏览器、Cookie、Header 或第三方回调带来的 locale 别名归一化到认证边界支持集。
 * 未命中映射时会按语言前缀兜底，最终回退到认证默认语言。
 */
export function normalizeLocale(...) {
	...
}
```

要求：不要罗列所有参数细节，优先说明兼容面、兜底顺序与最终默认行为。

#### 模板 C：无需保留函数前注释

适用场景：实现非常短、命名已经充分自解释，且没有额外契约、副作用或回退语义。

```typescript
function getSettingRecordCacheKey(key: string) {
	return `${SETTING_RECORD_CACHE_KEY_PREFIX}${key}`
}
```

要求：这类函数不强行补 JSDoc，避免为编辑器提示制造噪音。

### 4.5 本轮收口结论

- 候选组 A 到此收口，不继续扩到候选组 B/C。
- 本轮最终产出除具体注释修订外，还包括一条稳定的函数级 JSDoc 保留策略与模板，供后续同类治理直接复用。
- 后续若再推进注释治理，应以新的候选组切片重新准入，而不是继续在当前任务上顺手扩面。

## 5. 验证矩阵

- 静态检查：受影响文件编辑器诊断必须无新增错误。
- 定向 lint：受规则覆盖的 TypeScript 文件执行 ESLint，受影响 Markdown 文档执行 `lint-md`，避免“文档改了但格式与规则未复核”。
- 类型检查：执行 `pnpm exec nuxt typecheck`，确认注释调整没有引入意外语法或类型问题。
- 定向回归：执行 `server/services/setting.test.ts` 与 `server/utils/locale.test.ts`，确认设置回退链与 locale 归一化语义保持不变。
- Review Gate：至少完成一轮“注释是否准确、是否过量、是否与实现同步”的逐文件自检，并把结论落到 `docs/reports/regression/current.md`。

## 6. 已覆盖范围、剩余边界与漂移风险

### 6.1 已覆盖范围

- 已覆盖候选组 A 中的设置来源判定、locale 归一化、请求级鉴权上下文挂载与请求级 i18n 上下文注入。

### 6.2 仍未覆盖的边界

- 候选组 B：上传存储解析、文章访问控制与 AI 服务治理。
- 候选组 C：公开查询热点接口与查询 helper 的多语言聚合 / 宽查询裁剪约束。

### 6.3 当前漂移风险

- 若后续修改 `resolveSettingEnvEntry()`、localized setting 结构或 Better Auth locale 支持集，却没有同步更新本轮补齐的契约注释，`setting.ts` 与 `locale.ts` 最容易再次发生注释漂移。
- 若未来调整 `/api/auth`、公开接口匿名鉴权策略或 i18n 白名单路径，必须同步更新 `1-auth.ts` 与 `i18n.ts` 的边界说明，否则会再次把局部优化写成事实错误。

## 7. 证据落点

- 实施结果与验证记录：`docs/reports/regression/current.md`
- 当前阶段执行状态：`docs/plan/todo.md`
