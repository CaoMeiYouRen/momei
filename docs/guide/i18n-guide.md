# 国际化 (i18n) 使用指南

## 概述

墨梅博客使用 **Vue-i18n** 管理应用内容的多语言翻译，结合 **PrimeVue** 的内置国际化支持，实现完整的动态语言切换。

## 架构

### 双层国际化系统

```
┌──────────────────────────────────────┐
│        UI 层（应用界面）             │
├──────────────────────────────────────┤
│ • Vue-i18n: 应用文本翻译             │
│ • PrimeVue: UI 组件内置文本          │
│ • 自动同步: plugins/primevue-i18n.ts │
└──────────────────────────────────────┘
```

## 核心概念

### 1. 使用 `$t()` 翻译文本

在模板中使用 `$t()` 函数获取翻译文本：

```vue
<template>
    <Button :label="$t('common.save')" />
    <h1>{{ $t('pages.home.title') }}</h1>
</template>
```

### 2. 使用 `useI18n()` Composable

在脚本中使用 `useI18n()` 进行编程式翻译：

```typescript
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale, setLocale } = useI18n()

// 获取翻译
const message = t('common.welcome')

// 获取当前语言
console.log(locale.value)  // 'zh-CN'

// 切换语言
const switchLanguage = (lang: string) => {
    setLocale(lang)  // ← 自动同步 PrimeVue
}
</script>
```

### 3. 响应式翻译（重要）

使用 `computed` 确保翻译响应式更新：

```typescript
// ✅ 正确：使用 computed 包装
const title = computed(() => t('pages.title'))

// ❌ 错误：固定值，不会随语言变化
const title = t('pages.title')
```

## 添加新翻译

### 1. 在语言文件中添加键值对

编辑 `i18n/locales/zh-CN.json` 和 `i18n/locales/en-US.json`：

```json
// zh-CN.json
{
  "pages": {
    "myPage": {
      "title": "我的页面",
      "description": "这是一个示例"
    }
  }
}

// en-US.json
{
  "pages": {
    "myPage": {
      "title": "My Page",
      "description": "This is an example"
    }
  }
}
```

### 2. 在组件中使用

```vue
<template>
    <h1>{{ $t('pages.myPage.title') }}</h1>
    <p>{{ $t('pages.myPage.description') }}</p>
</template>
```

## 语言切换

### 自动切换（从用户账户）

当用户登录时，系统会自动读取用户的语言偏好：

```typescript
// app.vue 中的自动同步
watch(() => (session.value?.data?.user as any)?.language, (lang) => {
    if (lang) {
        setLocale(lang)  // ← 自动应用用户语言
    }
}, { immediate: true })
```

### 手动切换（通过菜单）

用户可以通过语言切换器手动切换：

```vue
<!-- components/language-switcher.vue -->
<Button icon="pi pi-globe" @click="toggleMenu" />
<Menu :model="localeMenuItems" :popup="true" />
```

**切换过程：**
1. 用户点击菜单选择语言
2. `setLocale()` 更新 Vue-i18n
3. PrimeVue 通过插件自动同步
4. 所有组件自动重新渲染

## 配置文件位置

| 功能 | 位置 |
|------|------|
| 中文翻译 | [i18n/locales/zh-CN.json](../../i18n/locales/zh-CN.json) |
| 英文翻译 | [i18n/locales/en-US.json](../../i18n/locales/en-US.json) |
| 总配置 | [nuxt.config.ts](../../nuxt.config.ts) L221-244 |
| 同步插件 | [plugins/primevue-i18n.ts](../../plugins/primevue-i18n.ts) |
| 语言切换器 | [components/language-switcher.vue](../../components/language-switcher.vue) |

## 最佳实践

### 1. 使用分层结构

```json
{
  "pages": {
    "home": { /* 首页翻译 */ },
    "about": { /* 关于页面翻译 */ }
  },
  "components": {
    "header": { /* 头部组件翻译 */ }
  },
  "common": {
    "save": "保存",
    "cancel": "取消"
  }
}
```

### 2. 避免硬编码文本

```typescript
// ❌ 不好：硬编码中文
<button>保存</button>

// ✅ 好：使用翻译键
<button>{{ $t('common.save') }}</button>
```

### 3. 使用 computed 进行响应式翻译

```typescript
// ❌ 不好：固定值
const errorMsg = t('errors.validationFailed')

// ✅ 好：使用 computed
const errorMsg = computed(() => t('errors.validationFailed'))
```

### 4. 保持翻译同步

添加新翻译时，**必须同时更新 zh-CN.json 和 en-US.json**，确保两种语言的键值对一致。

## 常见问题

### Q: 为什么切换语言后 PrimeVue 组件文本没变？

A: 这通常是因为 `primevue-i18n.ts` 插件没有加载。确保：
1. 插件文件存在于 `plugins/` 目录
2. Nuxt 会自动加载 `plugins/` 目录下的文件
3. 可以在浏览器控制台检查是否有错误

### Q: Password 组件的密码强度提示（"弱"、"中"、"强"）为什么不跟随语言切换？

A: 这是 PrimeVue Password 组件的一个已知限制。密码强度文本在组件初始化时被缓存，无法实时响应语言变化。

**解决方案**：
- 在切换语言后重新输入密码，新输入的内容会使用最新的 locale 配置
- 这个问题会在 PrimeVue 或 Vue-i18n 提供更好的响应式支持后得到改进

### Q: 如何添加新语言（如日文）？

A: 需要修改：
1. `nuxt.config.ts` 中的 i18n 配置
2. 在 `plugins/primevue-i18n.ts` 中添加语言映射
3. 创建 `i18n/locales/ja-JP.json` 文件

## 相关文档

- [PrimeVue 动态语言切换分析](../design/primevue-i18n-analysis.md)
- [Vue-i18n 官方文档](https://vue-i18n.intlify.dev/)
- [Nuxt i18n 模块](https://v8.i18n.nuxtjs.org/)
