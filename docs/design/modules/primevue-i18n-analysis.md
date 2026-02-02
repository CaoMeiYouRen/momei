# PrimeVue 动态语言切换实现分析

## 概述

墨梅博客实现了 **PrimeVue 与 Vue-i18n 的双层国际化系统**，可以实现**动态、无刷新的语言切换**。该实现将 UI 组件语言和应用内容语言分离管理。

---

## 架构设计

### 1. 核心技术栈

```typescript
// nuxt.config.ts
import { zh_CN } from 'primelocale/js/zh_CN.js'

primevue: {
    options: {
        locale: zh_CN,  // ← PrimeVue 组件语言
    }
},
i18n: {
    locales: [
        { code: 'en-US', language: 'en-US', name: 'English' },
        { code: 'zh-CN', language: 'zh-CN', name: '简体中文' }
    ],
    defaultLocale: 'zh-CN',
    // ...
}
```

**两层分离：**
- **PrimeVue 语言** (`primevue.options.locale`)：控制 Button、Dialog、DataTable 等 UI 组件的内置文本
- **Vue-i18n 语言** (`setLocale`)：控制应用自定义的内容和翻译

---

## 工作流程

### 2.1 初始化阶段

#### app.vue
```typescript
import { setLocale } = useI18n()

// 监听用户语言偏好，自动同步
watch(() => (session.value?.data?.user as any)?.language, (lang) => {
    if (lang) {
        setLocale(lang)  // ← 从数据库读取用户语言并设置
    }
}, { immediate: true })
```

**触发时机：**
- 用户登录时，从用户账户偏好读取语言
- 页面初始化时检查 Cookie (`i18n_redirected`)
- 首次访问自动检测浏览器语言

---

### 2.2 动态切换机制

#### components/language-switcher.vue
```vue
<template>
    <Button icon="pi pi-globe" @click="toggleMenu" />
    <Menu id="language_menu" ref="menu" :model="localeMenuItems" />
</template>

<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const localeMenuItems = computed(() => {
    return locales.value.map((l: any) => ({
        label: l.name,
        class: locale.value === l.code ? 'is-active-locale' : '',
        command: () => {
            setLocale(l.code)  // ← 核心切换方法
        },
    }))
})
</script>
```

**切换流程：**

```
用户点击语言菜单
    ↓
command: () => setLocale(l.code)
    ↓
Vue-i18n 更新应用语言
    ↓
所有使用 $t() 的组件自动响应式更新
    ↓
UI 显示新语言的文本
```

---

## 关键技术实现

### 3.1 PrimeVue 组件语言配置

#### 方案 1：静态初始化
```typescript
// nuxt.config.ts
import { zh_CN } from 'primelocale/js/zh_CN.js'

primevue: {
    options: {
        locale: zh_CN,  // 仅在初始化时加载
    }
}
```

**局限性：** 静态配置，需要动态切换则需要额外手段。

#### 方案 2：动态注入（推荐）- 已实现

文件位置：[plugins/primevue-i18n.ts](../../plugins/primevue-i18n.ts)

```typescript
// plugins/primevue-i18n.ts
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePrimeVue } from 'primevue/config'
import { zh_CN } from 'primelocale/js/zh_CN.js'
import { en } from 'primelocale/js/en.js'

export default defineNuxtPlugin((nuxtApp) => {
    // 避免在服务端执行
    if (import.meta.server) {
        return
    }

    // 在应用挂载后初始化，确保 i18n 已准备好
    nuxtApp.hook('app:mounted', () => {
        try {
            const { locale } = useI18n()
            const primevue = usePrimeVue()

            // PrimeVue 语言映射表
            const localeMap: Record<string, any> = {
                'zh-CN': zh_CN,
                'en-US': en,
            }

            // 同步函数
            const syncPrimeVueLocale = (localeCode: string): void => {
                if (localeMap[localeCode]) {
                    primevue.config.locale = localeMap[localeCode]
                }
            }

            // 初始化时同步当前语言
            syncPrimeVueLocale(locale.value)

            // 监听 Vue-i18n 语言变化，自动同步 PrimeVue
            watch(() => locale.value, (newLocale) => {
                syncPrimeVueLocale(newLocale)
            })
        } catch (error) {
            console.warn('PrimeVue i18n sync error:', error)
        }
    })
})
```

**实现要点：**
- ✅ 响应式同步：通过 `watch()` 监听 `locale.value` 变化
- ✅ 无需手动管理：自动同步 PrimeVue 和 Vue-i18n
- ✅ 支持动态语言切换：所有组件无缝切换
- ✅ 错误处理：使用 try-catch 增强稳定性
- ✅ 生命周期管理：在 `app:mounted` 钩子中初始化，确保依赖就绪

---

### 3.2 Vue-i18n 动态切换

#### useI18n() 核心方法

```typescript
const { locale, locales, setLocale, t } = useI18n()

// 1. 获取当前语言
console.log(locale.value)  // 'zh-CN'

// 2. 列出所有可用语言
console.log(locales.value)  // [{ code: 'en-US', name: 'English' }, ...]

// 3. 切换语言（核心操作）
setLocale('en-US')

// 4. 翻译文本
$t('common.save')  // 根据当前语言返回翻译
```

#### 响应式特性

```vue
<!-- 模板中自动响应 -->
<template>
    <!-- 切换语言时自动重新渲染 -->
    <h1>{{ $t('pages.home.title') }}</h1>
    
    <!-- 计算属性也自动响应 -->
    <div>{{ title }}</div>
</template>

<script setup>
const { t } = useI18n()

// ✅ 响应式：切换语言时自动更新
const title = computed(() => t('pages.home.title'))

// ❌ 非响应式：切换语言时不更新
const staticTitle = t('pages.home.title')
</script>
```

---

## 完整流程演示

### 4.1 用户语言切换完整流程

```typescript
// 步骤 1: 用户在语言切换器中选择 "English"
// components/language-switcher.vue
command: () => setLocale('en-US')

// 步骤 2: Vue-i18n 更新全局语言状态
locale.value = 'en-US'

// 步骤 3: 触发 watch 回调（如果有插件实现）
watch(() => locale.value, (newLocale) => {
    primevue.setLocale(localeMap['en-US'])  // 同步 PrimeVue
})

// 步骤 4: 所有使用 $t() 的组件重新计算
computed(() => t('common.save'))  // 重新求值

// 步骤 5: DOM 更新（变为英文）
<Button :label="$t('common.save')" />  // "Save"

// 步骤 6: 用户账户语言也更新（可选）
await updateUserLanguagePreference('en-US')

// 步骤 7: 下次登录时自动应用
// app.vue watch 会读取用户偏好
```

---

## 项目中的实现细节

### 5.1 语言切换器组件

[language-switcher.vue](../../components/language-switcher.vue) - 主菜单语言切换

```vue
<Menu
    id="language_menu"
    ref="menu"
    :model="localeMenuItems"
    :popup="true"
/>
```

**特点：**
- 🎯 显示当前激活语言（高亮效果）
- 📱 支持弹窗菜单（mobile-friendly）
- 🔄 无需页面刷新

### 5.2 管理端内容语言切换

[admin/content-language-switcher.vue](../../components/admin/content-language-switcher.vue) - 编辑内容时的语言选择

```vue
<Select
    v-model="contentLanguage"
    :options="availableLocales"
    option-label="label"
    option-value="value"
/>
```

**作用：**
- 在后台编辑多语言内容时切换编辑语言
- 独立于 UI 语言，可分别设置
- 用于分离"管理界面语言"和"编辑内容语言"

---

## 国际化架构

### 6.1 双语言模型

```
┌─────────────────────────────────────┐
│         用户界面语言 (UI)            │
├─────────────────────────────────────┤
│  setLocale() ──→ Vue-i18n locale   │
│  primevue.setLocale() ──→ PrimeVue │
└─────────────────────────────────────┘
              ↑
        ┌─────┴──────┐
        │            │
   用户手动     数据库偏好
   切换菜单    (自动应用)


┌──────────────────────────────────────┐
│      内容编辑语言 (contentLanguage)   │
├──────────────────────────────────────┤
│  useAdminI18n() → contentLanguage    │
│  用于后台编辑多语言内容                │
└──────────────────────────────────────┘
```

---

## 实现要点总结

### 7.1 核心概念

| 概念 | 说明 | 实现 |
|------|------|------|
| **Locale** | 当前活跃语言代码 | `locale.value = 'en-US'` |
| **Locales** | 支持的所有语言列表 | `locales.value` 配置 |
| **setLocale()** | 切换语言的函数 | `setLocale('en-US')` |
| **$t()** | 翻译文本的函数 | `$t('key')` |
| **Primelocale** | PrimeVue 内置翻译 | `zh_CN`, `en` 等 |

### 7.2 响应式切换的关键

```typescript
// ✅ 正确：计算属性自动响应语言变化
const buttonLabel = computed(() => t('common.save'))

// ✅ 正确：模板中使用 $t() 自动响应
<Button :label="$t('common.save')" />

// ❌ 错误：固定值，不会更新
const buttonLabel = t('common.save')  // 初始化后就固定了
```

### 7.3 同步 PrimeVue 的必要性

PrimeVue 组件（如 DataTable、DatePicker 等）有内置文本，需要单独同步：

```typescript
// 切换 UI 语言时，需要同步两个地方
setLocale('en-US')  // ← Vue-i18n (自动)
primevue.config.locale = en  // ← PrimeVue (通过插件自动)
```

### 7.4 Password 组件的特殊情况

**已知限制**：Password 组件的密码强度反馈文本（"弱"、"中"、"强"）在初始化时被缓存，现有的响应式策略无法完全解决这个问题。

**背景**：
- PrimeVue Password 组件在初始化时会读取 `primevue.config.locale` 中的 `weak`、`medium`、`strong` 字段
- 这些值被缓存在组件的内部状态中
- 虽然我们通过深度更新 `primevue.config.locale` 的所有字段来尝试触发响应式更新，但组件的内部缓存仍然不会被重新读取

**解决方案**：
1. **立即刷新**（推荐）：在组件中重新输入密码时，文本会基于最新的 locale 配置自动更新
2. **页面级缓存清除**：如果需要立即看到更新，可以刷新页面（不推荐）
3. **后续改进**：待 PrimeVue 或 Vue-i18n 提供更好的组件级响应式支持后优化

---

## 配置文件位置

- **PrimeVue 配置**: [nuxt.config.ts](../../nuxt.config.ts) L203-217
- **i18n 配置**: [nuxt.config.ts](../../nuxt.config.ts) L221-244
- **语言文件**: [i18n/locales/](../../i18n/locales/)
- **语言切换器**: [components/language-switcher.vue](../../components/language-switcher.vue)
- **内容语言 Composable**: [composables/use-admin-i18n.ts](../../composables/use-admin-i18n.ts)

---

## 最佳实践

1. ✅ **始终使用 computed** 包裹 `$t()` 以确保响应式
2. ✅ **在 watch 中同步 PrimeVue** 与 Vue-i18n 的语言变化
3. ✅ **分离 UI 语言和内容语言** 用于更灵活的多语言管理
4. ✅ **使用 Cookie 持久化语言选择** 用于用户体验
5. ✅ **从数据库读取用户语言偏好** 用于账户级别的语言记忆

---

## 参考资源

- [Vue-i18n 官方文档](https://vue-i18n.intlify.dev/)
- [PrimeVue 国际化](https://primevue.org/setup/)
- [Nuxt i18n 模块](https://v8.i18n.nuxtjs.org/)
