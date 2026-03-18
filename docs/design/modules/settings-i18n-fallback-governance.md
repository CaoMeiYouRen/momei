# 配置项多语言国际化与回退治理 (Localized Settings & Fallback Governance)

本文档是 [系统能力与设置](./system.md) 与 [国际化系统](./i18n.md) 的专项治理补充，聚焦“管理员可编辑配置项”的多语言存储、回退链、兼容迁移与统一消费口径。

本专题不重复描述整套系统设置能力，也不替代协议正文、文章翻译或 UI 文案翻译主文档。

## 1. 背景与问题

第十四阶段要求把“站点标题、关键词、公告、 SEO 文案、法律文本简介”等管理员可编辑配置，从当前的单值字符串模式，升级为可国际化、可回退、可兼容旧值的统一模型。

当前已确认的事实如下：

- `Setting` 实体仍采用轻量 KV 模型，`value` 是字符串，不区分 locale。
- [server/api/settings/public.get.ts](../../server/api/settings/public.get.ts) 当前直接返回单语言扁平字段，公开页、SEO、邮件和通知尚未共用一套“配置值回退解析器”。
- [components/admin/settings/general-settings.vue](../../components/admin/settings/general-settings.vue) 仍按单输入框编辑 `site_title`、`site_description`、`site_keywords` 等字段，后台尚未提供逐语言编辑能力。
- `Locale Registry` 已在 [i18n/config/locale-registry.ts](../../i18n/config/locale-registry.ts) 固化回退链，其中 `zh-TW -> zh-CN -> en-US`、`en-US -> zh-CN`、`ko-KR -> en-US -> zh-CN` 已是运行时事实。
- 法律协议正文已经由 `AgreementContent` 实体承担版本治理；这次仅新增“法律文本简介 / 提示文案”类配置的多语言能力，不把完整协议正文重新塞回 `setting`。

## 2. 设计目标与非目标

### 2.1 设计目标

1. 为可翻译配置项定义统一的多语言存储结构，并兼容现有单字符串旧值。
2. 统一公开设置、SEO、邮件、通知等链路对配置文案的读取口径，避免各处私自回退。
3. 明确后台设置页的“可翻译字段”和“全局单值字段”边界，减少管理员误解。
4. 为后续 AI 配置翻译、法律文本草案编辑提供同一套底层数据模型。

### 2.2 非目标

1. 不修改 `Setting` 表结构，不新增独立的配置翻译表。
2. 不替代前端 UI 文案的 `i18n/locales/<locale>/*.json` 体系。
3. 不把用户协议、隐私政策正文迁移回 `Setting`；其权威版本和参考译本继续由 `AgreementContent` 管理。
4. 不在本轮引入“任意语言自动机翻即刻生效”的策略； AI 生成只作为草案输入，不改变人工确认边界。

## 3. 配置项分层治理

为避免“所有配置都多语言化”导致模型膨胀，本轮将设置项分为三类：

| 类型 | 适用示例 | 存储方式 | 是否参与 locale 回退 |
| :--- | :--- | :--- | :--- |
| 可翻译配置 | `site_title`、`site_description`、`site_keywords`、公告文案、SEO 简介、法律文本简介 | `Setting.value` 中的结构化 JSON | 是 |
| 全局单值配置 | `site_name`、`site_url`、`default_language`、布尔开关、上传限制、密钥 | 维持单字符串 / 标量 | 否 |
| 实体化多语言内容 | 协议正文、文章、分类、标签 | 继续使用独立实体与 `translationId` | 使用实体自己的治理规则 |

### 3.1 第一批纳管范围 (P0)

第一批优先纳管以下管理员可编辑字段：

- 站点标题类：`site_title`
- SEO 描述类：`site_description`
- SEO 关键词类：`site_keywords`
- 运营主体：`site_operator`
- 版权所有者：`site_copyright_owner`(留空时回退到运营主体，其次回退到站点标题。)
- 友链申请说明：`friend_links_application_guidelines`
- 后续预留：公告文案、首页介绍、法律文本简介、通知模板摘要等“管理员编辑且需要按语言显示”的短文本配置

### 3.2 暂不纳管的字段

以下字段在本阶段继续保持全局单值：

- 品牌常量：`site_name`
- 所有布尔、数字、枚举、密钥、第三方凭据类配置

原则上，只有“面向读者展示，且不同语言下需要不同文案”的字段，才进入可翻译配置模型。

## 4. 数据模型设计

### 4.1 保持 KV，不改表结构

本轮继续沿用 `Setting.value: string | null` 的轻量模型。对可翻译配置项，`value` 不再只保存裸字符串，而是保存带版本号的结构化 JSON。

建议的统一结构如下：

```typescript
import type { AppLocaleCode } from '@/i18n/config/locale-registry'

type LocalizedSettingType = 'localized-text' | 'localized-string-list'

interface LocalizedSettingValueV1<T = string | string[]> {
    version: 1
    type: LocalizedSettingType
    locales: Partial<Record<AppLocaleCode, T>>
    legacyValue?: T | null
}
```

建议约束：

- `localized-text` 用于标题、描述、公告、简介等单文本字段。
- `localized-string-list` 用于关键词、短标签列表等值语义上是数组的字段。
- `legacyValue` 只用于兼容历史单字符串旧值，不作为长期正式写入目标。

### 4.2 旧值兼容策略

为兼容现有单字符串配置，服务层解析规则如下：

1. 若 `Setting.value` 不是合法 JSON，按“旧单值字符串”处理。
2. 若是合法 JSON 且满足 `LocalizedSettingValueV1` 结构，按多语言配置处理。
3. 若是其他 JSON 结构但不符合协议，视为旧值并记录治理告警，避免线上直接读空。

旧值兼容口径：

- 旧单值字符串视为 `legacyValue`，在缺少对应 locale 文案时可作为最后一道兼容回退。
- 后台设置页必须显式提示“当前字段仍使用旧单值格式，尚未迁移为逐语言配置”。
- 一旦管理员使用新的多语言编辑器保存，该字段应写入结构化 JSON，并逐步淘汰 `legacyValue`。

### 4.3 字段注册表

为了避免服务层根据 key 名硬编码猜测，后续应增加“可翻译设置注册表”，至少声明以下元信息：

```typescript
interface LocalizedSettingDefinition {
    key: string
    valueType: 'localized-text' | 'localized-string-list'
    publicReadable: boolean
    adminEditable: boolean
    fallbackMode: 'locale-registry'
    legacyCompatibility: true
}
```

该注册表的作用：

- 判定某个设置是否走多语言解析。
- 决定后台编辑器使用文本框、富文本框还是多值关键词输入。
- 约束公开接口能否暴露该字段。
- 为后续 AI 翻译入口复用同一套 key 元信息。

## 5. 回退链治理

### 5.1 唯一事实源

可翻译配置的 locale 回退链，必须复用 `Locale Registry`，不能在公开页、SEO、邮件、通知等链路各自维护一套 if/else。

当前必须被文档和代码共同遵守的最小规则：

- `zh-TW` 按 `zh-TW -> zh-CN -> en-US` 读取。
- 其他语言至少满足“当前 locale -> en-US”的基础回退要求。
- 若 `Locale Registry` 为某语种声明了更完整的链路，则以注册表为准。例如当前 `ko-KR -> en-US -> zh-CN`。

### 5.2 统一解析器

后续应在 `server/services/setting.ts` 之上新增统一解析函数，例如：

```typescript
interface ResolvedLocalizedSetting<T = string | string[]> {
    key: string
    value: T | null
    requestedLocale: AppLocaleCode
    resolvedLocale: AppLocaleCode | 'legacy' | null
    fallbackChain: AppLocaleCode[]
    usedFallback: boolean
    usedLegacyValue: boolean
}

async function getLocalizedSetting<T>(key: string, locale?: string | null): Promise<ResolvedLocalizedSetting<T>>
```

统一解析器必须承担以下职责：

1. 先归一化外部 locale 到 `AppLocaleCode`。
2. 读取注册表定义的回退链。
3. 依序查找 `locales[locale]`。
4. 若整条链都缺失，再决定是否回退到 `legacyValue`。
5. 返回 `resolvedLocale`，供调用方记录“命中了哪个语种”。

### 5.3 回退顺序

统一顺序建议如下：

```text
请求 locale -> Locale Registry fallbackChain -> legacyValue -> null
```

说明：

- `legacyValue` 放在 locale 链末尾，目的是让结构化翻译优先于旧值。
- 不允许在业务层绕开解析器，直接写出“当前值为空就回退中文”之类的分散逻辑。
- 若 `resolvedLocale !== requestedLocale`，公开链路应能决定是否展示“当前为回退语言内容”的提示。

## 6. 公开接口与消费链路

### 6.1 公开设置接口

[server/api/settings/public.get.ts](../../server/api/settings/public.get.ts) 后续应从“读取纯值”切换为“读取已按 locale 解析的值”，但保持对外字段名尽量稳定。

建议输出形态：

```typescript
interface PublicSettingsI18nMeta {
    locale: AppLocaleCode
    fallbackChain: AppLocaleCode[]
    resolvedLocales: Record<string, AppLocaleCode | 'legacy' | null>
}

interface PublicSettingsResponse {
    siteTitle: string | null
    siteDescription: string | null
    siteKeywords: string[] | string | null
    i18n: PublicSettingsI18nMeta
}
```

约束如下：

- `siteTitle`、`siteDescription`、`siteKeywords` 等字段仍保留扁平输出，减少前端消费改动。
- 新增 `i18n.resolvedLocales` 用于说明每个字段最终命中了哪种语言或 `legacy`。
- 公开侧不直接暴露后台存储的完整 `locales` map，避免把未发布的半成品翻译全部下发给前端。

### 6.2 SEO 口径

`usePageSeo()`、页面 `useHead()`、 sitemap / feed alternates 中凡是消费站点配置文案的地方，都应复用同一套解析器结果，不允许再次手工拼装回退。

治理要求：

- SEO 标题、描述与站点名称相关拼接必须读取“当前 locale 的有效配置值”。
- 若使用了回退值，应保证 `og:locale`、`hreflang` 与页面 URL 语种仍以请求 locale 为准，不因文案回退而篡改路由 locale。
- SEO 只消费“已解析后的展示文案”，不直接读取存储层 JSON。

### 6.3 邮件与通知口径

邮件、通知中心和站务消息涉及管理员可编辑文案时，也应复用相同的配置解析器：

- 邮件主题中的站点标题、摘要、法律简介等统一按接收者 locale 解析。
- 通知模板、订阅确认文案、偏好页引导文案若改为管理员可配，也必须接入同一模型。
- 不允许“公开页走 zh-TW -> zh-CN -> en-US，邮件却只走 locale -> zh-CN”的分叉行为。

## 7. 后台设置页交互设计

### 7.1 编辑模式

后台系统设置页对每个纳管字段增加“逐语言编辑”能力，推荐交互如下：

- 字段头部显示该字段是“可翻译配置”还是“全局单值配置”。
- 可翻译字段使用 locale Tabs 或语言切换下拉，逐语种编辑。
- 未填写的 locale 应显示“缺失翻译”状态，而不是静默显示默认语言内容。

### 7.2 迁移提示

若某字段仍是旧单值字符串，后台必须展示以下信息：

- 当前字段尚未迁移为多语言格式。
- 当前保存的旧值会作为跨语言兼容回退使用。
- 管理员首次保存逐语言内容后，将切换到新的结构化格式。

### 7.3 全局字段与可翻译字段分离

后台页面需要明确区分：

- 哪些字段“按语言编辑”。
- 哪些字段“整站共用单值”。

不能让管理员误以为 `site_url`、第三方密钥、布尔开关也会随 locale 切换。

### 7.4 草案与人工确认

未来接入 AI 生成配置翻译时，后台需要复用同一编辑器：

- AI 生成结果直接填入对应 locale 草稿位。
- 管理员仍需手工确认后保存。
- AI 不得绕过人工直接覆盖现有生效翻译。

## 8. 法律文本边界

法律相关能力必须拆分为两层：

1. **协议正文**：继续由 `AgreementContent` 管理权威版本、参考译本、生效状态和用户同意记录。
2. **协议简介 / 摘要 / 跳转说明**：若这些是管理员在设置页维护的短文案，则纳入本次可翻译配置模型。

这意味着：

- `LEGAL_MAIN_LANGUAGE`、`LEGAL_USER_AGREEMENT_ID`、`LEGAL_PRIVACY_POLICY_ID` 仍然是全局单值配置。
- 法律短文案的 locale 回退必须遵守本文件定义的统一解析器。
- “协议正文缺少翻译时回退到权威版本”的现有治理，不应被误写成 Setting fallback 规则。

## 9. 测试与验收边界

### 9.1 服务层测试

至少补齐以下场景：

1. 旧单值字符串兼容：旧值仍能被各 locale 读取，并返回 `resolvedLocale = legacy`。
2. 缺词回退：如 `zh-TW` 缺词时按 `zh-TW -> zh-CN -> en-US` 命中。
3. 跨语言读取：`en-US`、`ko-KR`、`zh-CN` 对同一设置读取结果稳定且可解释。

### 9.2 接口测试

至少覆盖：

1. `/api/settings/public` 返回已解析值与 `i18n.resolvedLocales`。
2. 后台设置接口能返回多语言字段的元信息与迁移状态。
3. 旧值与新 JSON 格式可以并存读取，不会因为异常 JSON 直接返回空。

### 9.3 后台交互测试

至少覆盖：

1. locale 切换编辑与未保存提醒。
2. 旧值迁移提示显示。
3. 缺失翻译状态提示，而不是偷偷展示其他语言文本。

## 10. 分阶段落地建议

### 10.1 第一阶段：文档与契约

- 完成本文档。
- 在 `system.md`、`i18n.md` 中补齐边界说明。
- 明确第一批纳管 key 和测试目标。

### 10.2 第二阶段：服务层与接口

- 为 `SettingService` 增加本地化解析器。
- 扩展 `/api/settings/public` 与 `/api/admin/settings` 的多语言元信息。
- 补齐服务层和接口层测试。

### 10.3 第三阶段：后台编辑器

- 在系统设置页加入 locale 编辑与迁移提示。
- 区分全局单值字段和可翻译字段。
- 补齐交互测试。

## 11. 相关文档

- [系统能力与设置](./system.md)
- [系统配置深度解耦与统一化](./system-config-unification.md)
- [国际化系统](./i18n.md)
- [法律合规相关设计](./system.md#25-协议版本治理-agreement-governance)
