# 2026-08 PrimeVue 5 许可证变更专项评估

## 1. 背景

Dependabot 于 2026-08-26 通过 `primevue-core` group 提出跨 9 个包的大版本升级 PR：

| PR | Group | 升级内容 | 版本变化 |
|:---|:------|:---------|:---------|
| [#688](https://github.com/CaoMeiYouRen/momei/pull/688) | `primevue-core` | `primevue` 4.5.5 → 5.0.1 | Major |
| [#688](https://github.com/CaoMeiYouRen/momei/pull/688) | `primevue-core` | `@primevue/core` / `forms` / `icons` / `nuxt-module` 4.5.5 → 5.0.1 | Major |
| [#688](https://github.com/CaoMeiYouRen/momei/pull/688) | `primevue-core` | `@primeuix/styled` 0.7.4 → 1.0.0 | Major |
| [#688](https://github.com/CaoMeiYouRen/momei/pull/688) | `primevue-core` | `@primeuix/styles` / `themes` 2.0.3 → 3.0.0 | Major |
| [#688](https://github.com/CaoMeiYouRen/momei/pull/688) | `primevue-core` | `@primeuix/utils` 0.7.2 → 0.8.1 | Minor |

该 PR 的 CI 仅 `Test`（typecheck）失败，`Build (Nuxt)` / `Unit` / `Coverage` / `E2E 1-4` / `Build & Lighthouse` 全部通过。**技术信号良好，但经许可证核查后判定为 No-Go。**

Dependabot 未能提供有效变更依据：`primefaces/primevue` 的 `CHANGELOG.md` 已清空为单行标题，变更记录随文档站迁移到新域名，因此本评估基于一手官方文档而非 PR 正文。

---

## 2. 结论：❌ 不升级，并长期屏蔽

阻塞点不在代码层，而在许可证层：**PrimeVue 5 起不再作为开源软件发布**，与本项目 MIT + 自部署分发模型存在结构性冲突。

---

## 3. 许可证变更事实

PrimeTek 将 PrimeNG / PrimeReact / PrimeVue 统一并入新的 **PrimeUI** 商业许可品牌，核心条款：

| 项目 | 内容 |
|:-----|:-----|
| 适用范围 | 仅未来大版本：PrimeNG 22、PrimeReact 11、**PrimeVue 5** |
| 存量版本 | PrimeVue 4 及更早**永久保持 MIT**，变更不追溯 |
| 分发形式 | 编译后的 npm 包，不再提供源码 |
| 许可校验 | 需注入 license key；离线校验，无 phone-home |
| 缺 key 行为 | 可能在应用中显示 license notice |
| Community 许可 | 免费但需符合资格（营收 < $1M、开发者 < 5 人、员工 < 10 人、外部融资 < $3M），最多 4 seat，**有效期 12 个月需按年续期** |
| Commercial 许可 | $599/开发者（2026 年内），2027 年起 $799/开发者 |
| 付费组件 | `Chart`、`Text Editor` 等划入 PrimeUI PRO，Community 不含 |

`@primevue/nuxt-module` 5 新增 License 配置段，key 可经 `NUXT_PUBLIC_PRIMEUI_LICENSE` 环境变量或 `runtimeConfig.public` 注入。

---

## 4. 与本项目的冲突

本项目为 MIT 许可（`package.json` `license` 字段）、面向用户自行部署的开源博客程序，冲突逐条对应：

1. **官方指引即为不升级**。PrimeUI Community License 的「Open Source Projects」章节明确：PrimeUI 不设开源项目专项计划，开源项目应继续使用 MIT 版本（PrimeNG 21、**PrimeVue 4**、PrimeReact 10 及更早）。即官方为开源项目指定的归属路径就是留在 v4。
2. **再分发禁令与自部署模型冲突**。Community License 禁止「以源码或组件形式分发软件，使客户或最终用户能够基于它构建自己的应用」，该场景需 OEM License。本项目用户通过克隆仓库自行构建，与该条款的边界判定属法务灰区，不应由技术侧单方面认定合规。
3. **license key 无法随仓库分发**。条款禁止公开发布或分发 key 供他人规避自身许可，因此无法在开源仓库中内置可用 key。
4. **责任转嫁给下游部署者**。结果是每位自部署用户需自行申请 Community key 并按年续期确认资格；政府机构与公立教育机构明确不符合 Community 资格，需购买 Commercial 许可。未持有效 key 时界面可能出现 license notice。
5. **编译分发削弱可审计性**。包不再提供源码，与开源项目的依赖审计、安全排查与本地打补丁能力相冲突。

---

## 5. 技术层破坏性变更

以下变更即便许可证可接受也需处理，记录以备后续复评：

### 5.1 基准字号从 14px 改为 16px

v4 及更早的 preset 按 14px 根字号校准，v5 改为按浏览器默认 16px 校准；每个 preset 另发 `-compat` 变体兼容 14px 根，**compat 变体仅维护至 2027 年 6 月**。

本项目未覆写 `html` 根字号，实际取浏览器默认 16px，按官方口径可直接使用标准 preset、无需 compat；但 v4 的 token 按 14px 校准却运行在 16px 根上，因此升级后全部 PrimeVue 组件尺寸会相对当前渲染结果发生整体位移，`nuxt.config.ts` 中的 `definePreset(Aura, ...)` 自定义 preset 需重新校准。

### 5.2 `ProgressSpinner.strokeWidth` 类型收紧

prop 类型由 `string` 收紧为 `number`，7 处字符串型 `stroke-width` 写法需改为绑定式数值（6 处 `"4"`、1 处 `"3"`）。这是 PR #688 中 typecheck 失败的全部成因：

| 文件 | 现有写法 | 应改为 |
|:-----|:---------|:-------|
| `components/admin/ai/task-details-dialog.vue` | `stroke-width="4"` | `:stroke-width="4"` |
| `components/admin/dashboard/creator-stats-panel.vue` | `stroke-width="4"` | `:stroke-width="4"` |
| `components/admin/posts/ai-image-generator.vue` | `stroke-width="4"` | `:stroke-width="4"` |
| `components/admin/snippets/snippet-aggregate-dialog.vue` | `stroke-width="3"` | `:stroke-width="3"` |
| `pages/admin/ai/tasks/[id].vue` | `stroke-width="4"` | `:stroke-width="4"` |
| `pages/admin/index.vue` | `stroke-width="4"` | `:stroke-width="4"` |
| `pages/admin/migrations/link-governance.vue` | `stroke-width="4"` | `:stroke-width="4"` |

（`components/rss-icon.vue` 的 `stroke-width="3"` 属于原生 SVG 属性，不受影响。）

### 5.3 不受影响项

本项目未使用 PrimeVue 的 `Chart` 与 `Editor` 组件（编辑器链路基于 mavon-editor 与自研组件），因此 PrimeUI PRO 的组件付费化本身不构成额外阻塞。

---

## 6. 屏蔽策略与长期影响

| 依赖 | 当前版本 | 屏蔽版本 | 理由 |
|:-----|:---------|:---------|:-----|
| `primevue` | ^4.5.5 | >=5.0.0 | 许可证转为 PrimeUI 商业许可 |
| `@primevue/*` | ^4.5.5 | >=5.0.0 | 与主包同线发布，同一许可 |
| `@primeuix/styled` | ^0.7.4 | >=1.0.0 | v5 引擎层，需与主包版本配对 |
| `@primeuix/styles` | ^2.0.3 | >=3.0.0 | 同上 |
| `@primeuix/themes` | ^2.0.3 | >=3.0.0 | 同上 |
| `@primeuix/utils` | ^0.7.2 | >=0.8.0 | 同上 |

`@primeuix/*` 四个包必须与主包一同屏蔽：它们是 v5 的样式与主题引擎层，若单独放行会与锁定在 4.x 的 `primevue` 产生版本错配。屏蔽采用显式枚举而非 `@primeuix/*` 通配，因为四个包的阈值各不相同；若后续出现新的 `@primeuix/<新包>` 进入 `primevue-core` group，需评估后追加对应的显式 ignore 条目。

长期影响：锁定在 4.x 意味着 PrimeVue 成为**终点依赖**。MIT 授权本身永久有效，但官方未承诺 v4 的长期安全维护窗口，功能与安全更新预期停止。这构成需要独立立项处理的中期技术风险，已记入 [backlog.md](../../plan/backlog.md) 长期主线第 11 条。

---

## 7. 后续评估议题

「迁移到其他 UI 组件库」需作为独立议题评估，不在依赖 PR 中决策。评估应至少覆盖：

- 现有 PrimeVue 组件用法盘点与替换成本（组件种类、`definePreset` 主题体系、`cssLayer` 层叠约定、暗色模式 `.dark` 选择器契约、PrimeVue locale 接入）。
- 候选库的许可证稳定性（优先考察治理模式，避免重复踩到同类许可证转向）。
- 无障碍能力、SSR / Nuxt 兼容性、bundle 体积与首屏性能影响。
- 迁移可否分模块渐进推进，以及「维持 4.x 不动」作为基线方案的可接受年限。

---

## 8. 相关链接

- [Dependabot 配置](../../../.github/dependabot.yml) — 已添加对应忽略规则
- [PrimeUI 许可变更公告 — The Next Chapter of PrimeTek](https://primeui.dev/nextchapter)
- [PrimeUI Community License](https://primeui.dev/licenses/community)
- [PrimeUI Pricing](https://primeui.dev/pricing)
- [PrimeVue 5 Styled Mode — Base Font Size](https://primevue.dev/theming/styled/)
- [PrimeVue 5 Nuxt 集成 — License 配置](https://primevue.dev/nuxt)
