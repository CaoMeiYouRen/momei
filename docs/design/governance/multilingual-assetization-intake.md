# 多语言内容资产化增强包 — 统一承接入口设计

本文档定义第三十二阶段唯一新增功能「多语言内容资产化增强包」的统一承接入口设计，作为 `pages/benefits.vue` 及其关联 CTA 导流链路的唯一事实源。

## 1. 背景与定位

### 1.1 决策来源

- [商业化转型可行性重评框架](./commercialization-reassessment-framework.md) 得出「降级观察」结论，明确下一步必须先补统一承接层，再验证付费兴趣。
- 当前公开站点缺少「入口 → 承接 → 行动」的统一转化链，首页 Hero 注释、Demo Banner 分流、About 页仅品牌说明。

### 1.2 本轮定位

本设计只做「独立说明 / 申请页 + 真实 CTA 导流」，不进入支付、价格页、会员中心或营销后台实现。页面角色是**说明 + 意向收集**，不是销售页。

## 2. 单一主卖点

> **让你的技术内容自动触达全球读者。**
>
> *Let your technical content reach readers worldwide — automatically.*

解释口径：

- 免费核心（墨梅开源博客）提供：AI 创作助手、原生多语言界面、单篇文章翻译、基础分发能力。
- 增强包提供：批量翻译编排、多平台分发状态追踪、跨入口内容资产统一管理 —— 把「单篇文章多语言」升级为「内容资产化全球运营」。

## 3. 免费核心与付费增强边界

| 层级 | 能力范围 | 交付方式 |
|------|----------|----------|
| **开源免费核心** | Markdown 编辑器、AI 建议标题 / 摘要 / 标签、单篇文章 AI 翻译、多语言 UI、RSS / sitemap / feed 分发、Demo 模式 | 开源仓库，自部署 |
| **增强包（本轮说明对象）** | 批量翻译编排（多篇 → 多语）、术语一致性检查、翻译后预览与发布前检查、多平台分发状态追踪与失败重试、跨入口内容资产统一收敛 | 独立说明页 + 候补名单 |

**边界原则**：不把现有免费能力加锁伪装成增强包；增强包提供的编排、追踪、收敛能力在免费核心中不存在。

## 4. 页面结构

页面路由：`/benefits`

| 区块 | 职责 | 内容要点 |
|------|------|----------|
| **Hero** | 主卖点 + 一句话解释 | 单一标题文案、副标题展开价值、主 CTA 按钮 |
| **对比区（Free vs Premium）** | 明确边界 | 左右分栏或卡片对比，列出免费核心已有能力 vs 增强包额外能力 |
| **增强包能力卡片** | 展示具体增强内容 | 批量翻译编排、分发追踪、资产统一管理，每项配图标 + 一句话 + 简短解释 |
| **FAQ** | 消除疑虑 | 常见问题：是否影响现有博客、是否需迁移、增强包是否另行部署、候补名单后续流程 |
| **CTA 区** | 意向收集 | 简短表单（姓名 + 邮箱）、提交按钮、成功 / 失败反馈 |
| **联系 / 回退** | 降级出口 | GitHub、邮箱、回到博客首页 |

## 5. CTA 流程设计

### 5.1 导流入口

至少从以下入口接入一条真实 CTA：

| 入口 | 位置 | CTA 文案 | 优先级 |
|------|------|----------|--------|
| Demo Banner | `components/demo-banner.vue` 新增第四条路径 | 「了解增强包」→ `/benefits` | 本轮必做 |
| About 页 | 联系方式区或页脚新增链接 | 「了解更多增强能力」→ `/benefits` | 本轮必做 |
| GitHub README | 仓库 `README.md` 补链接 | 「了解多语言内容资产化增强包」 | 建议但不强求 |
| 页脚公共区 | `components/app-footer.vue` 补链接 | 「增强包」 | 可选 |

### 5.2 承接动作

表单提交后：

1. 客户端校验（姓名非空、邮箱格式）。
2. 提交到后端 API（暂用已有 `POST /api/submissions` 或新开 `POST /api/benefits/waitlist`）。
3. 成功 → 展示确认文案。
4. 失败 → 展示重试提示，并保留已填内容。

**非目标**：不做邮件确认、不做 CRM 集成、不做自动回复。

## 6. i18n 设计

### 6.1 命名空间

使用 `public.json` 中的 `pages.enhanced_pack` 路径，复用现有公开页懒加载策略（与 `about`、`feedback` 同级）。

### 6.2 键结构

```
pages.enhanced_pack:
  meta:
    title          # SEO 标题
    description    # SEO 描述
  hero:
    title          # "让你的技术内容自动触达全球读者"
    subtitle       # 展开的一句话价值说明
    cta            # 主按钮文案："了解增强包"
  free_core:
    heading        # "开源免费核心"
    items[]: { title, desc }
  premium:
    heading        # "内容资产化增强包"
    description    # 概述
    items[]: { title, desc, icon }
  comparison:
    heading        # "免费 vs 增强"
    free_label     # "墨梅开源版"
    premium_label  # "增强包"
    rows[]: { feature, free, premium }
  faq:
    heading        # "常见问题"
    items[]: { q, a }
  cta_form:
    heading        # "加入候补名单"
    description    # 解释候补机制
    name_label     # "姓名"
    name_placeholder
    email_label    # "邮箱"
    email_placeholder
    submit         # "提交申请"
    submitting     # "提交中..."
    success        # 成功文案
    error          # 失败文案
    privacy_note   # 隐私提示
```

### 6.3 需要覆盖的语言

- `zh-CN`（默认）
- `en-US`（必做）
- `ja-JP`、`zh-TW`、`ko-KR`（补齐基础翻译）

## 7. 技术实现要点

### 7.1 页面组件

- `pages/benefits.vue`：Composition API (`<script setup lang="ts">`) + BEM SCSS
- 复用现有 `usePageSeo`、`useI18n`（`$t` / `rt` / `tm`）
- 参考 `pages/about.vue` 的 Hero 区、卡片区、联系区结构
- 使用 `<ClientOnly>` 包裹表单区以避免 SSR hydration 问题

### 7.2 后端 API（最小可行）

- `POST /api/benefits/waitlist`：接收 `{ name, email, locale }`，写入 `benefit_waitlist` 表或复用现有 submissions 机制
- 不做邮件发送、不做去重校验（最小闭环即可）

### 7.3 不涉及

- 支付接口、价格页、会员权限
- 邮件自动化、CRM
- 管理后台查看候补名单（后续可补）

## 8. 验证矩阵

| 验证项 | 方法 | 证据 |
|--------|------|------|
| 页面可访问 | `pnpm dev` → 访问 `/benefits` | 页面正常渲染 |
| i18n 多语言 | 切换 `zh-CN` / `en-US` 验证 | 所有文案正确切换 |
| 表单提交 | 填写姓名/邮箱 → 提交 → 检查 API 响应 | 成功/失败状态正确展示 |
| Demo Banner CTA | 访问首页 → Demo Banner 第四条路径 → 跳转 `/benefits` | 跳转成功 |
| About CTA | 访问 `/about` → 点击增强包链接 → 跳转 `/benefits` | 跳转成功 |
| 响应式 | 桌面 / 平板 / 手机视口 | 布局不错乱 |
| 暗色模式 | 切换暗色主题 | 颜色正确适配 |
| TypeScript | `pnpm typecheck` | 无新增类型错误 |
| ESLint | `pnpm lint` | 无新增 lint 错误 |
| Vitest | `pnpm test` | 新增定向测试通过 |

## 9. 回滚边界

- 如果候补名单长期无有效信号 → 可保留页面作为说明页，关闭表单提交。
- 如果后续决定不继续推进商业化 → 移除 Demo Banner / About 页的 CTA 链接，页面保留为能力说明页。
- 页面本身不与任何付费逻辑耦合，可随时降级为纯静态说明页。

## 10. 相关文档

- [商业化转型可行性重评框架](./commercialization-reassessment-framework.md)
- [项目路线图](../../plan/roadmap.md) — 第三十二阶段
- [待办事项](../../plan/todo.md)
- [开发规范](../../standards/development.md)
- [About 页面参考代码](../../../pages/about.vue)
- [Demo Banner 组件](../../../components/demo-banner.vue)
