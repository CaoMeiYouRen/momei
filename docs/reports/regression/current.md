# 当前回归窗口

本文档用于承载最近 1 - 2 个阶段的活动回归记录，是当前唯一允许继续追加近线回归正文的正式写入位置。

既有历史正文可通过 [旧活动日志迁移快照](./archive/legacy-plan-regression-log.md) 回看；新增回归治理和管理口径以 [回归记录管理与深度归档](./index.md) 为准。

## 说明

- 该文件应只保留近线证据与最近基线比较所需的记录。
- 超出当前窗口的历史记录应整体迁移到 [archive/index.md](./archive/index.md) 下的模块或日期分片。
- 「在册族开口标签」统计口径：剥离注释后按守卫的标签边界规则（`<Name` 后必须是空白 / `/` / `>`）计数**开口标签处数**，括号内给出不同的**组件名个数**；两者均由 `tests/modules/ui-library-route-migration-guard.test.ts` 的在册族清单界定，可脚本复算。

<!-- regression-window:start:coverage-batch-12:第七十一阶段条目 6a 覆盖率第十二批:2026-11-08 -->

## 2026-11-08 第七十一阶段条目 6a：覆盖率第十二批（4 模块，含大基数）

### 选模与算式

- 目标：全仓 statements 单批 **+0.3pp**。基线 **28,993 / 36,790 = 78.8067%**，所需新增覆盖语句 `0.003 × 36,790 = 110.4` → 至少 **111 条**。
- 选模按**绝对未覆盖语句数**：`server/database/typeorm-adapter.ts` **84**（大基数，必须纳入）/ `server/services/ai/quota-governance.ts` **28** / `server/services/agreement.ts` **26** / `server/services/post-hexo-repository-sync.ts` **23**，合计 **161 条 > 111**。
- 结果：四模块未覆盖 84→6、28→0、26→1、23→0，实际新增 **154 条**；全仓 **29,147 / 36,790 = 79.2253%**，**+0.4186pp**（≥ 目标）。

### 补测内容

- `server/database/typeorm-adapter.operations.test.ts`（新增 **17 例**）：create / update / updateMany / deleteMany / findOne / findMany / count / consumeOne / incrementOne / 异常包装 / 实体名与关系解析 / `select` 裁剪 / 模型缺失报错。
- `quota-governance.test.ts`（+13）、`agreement.test.ts`（+12）、`post-hexo-repository-sync.test.ts`（+8）：失败与边界优先（配额边界、协议权威版本选择、同步冲突与空输入）。
- 合计新增 **50 例**，定向 **71 passed**（含既有用例）。

### 发现但未修改

- `server/database/typeorm-adapter.ts` 的 `transformOutput`：先写 `id: data.id || data._id`，随后字段回写循环用 `data.id` 把 `id` 覆盖为 `undefined`；仅 `_id` 的 Mongo 风格记录会丢主键（SQL 实体均有 `id`，实际影响低）。已登记 backlog，本批不改产品逻辑。
- 不可达防御分支：`agreement.ts:184`（`sourceAgreement` 来自已过滤集合）、适配器若干防御分支；不为此写「为覆盖而覆盖」的断言。

### 验证

- 全量 `pnpm test:coverage --coverage.reportOnFailure`：statements 总数 36,790（两轮同口径）；本批 4 个测试文件全部通过。
- `pnpm typecheck` 0；ESLint（5 个测试文件）0 error / 0 warning。
- 既有本地环境噪声（25–26 个 Nuxt virtual module / 通知类 suite）在本批前后集合一致，非本批引入。

<!-- regression-window:end:coverage-batch-12:第七十一阶段条目 6a 覆盖率第十二批:2026-11-08 -->

<!-- regression-window:start:defects-i18n:第七十一阶段条目 6b-6d i18n 与缺陷治理:2026-11-08 -->

## 2026-11-08 第七十一阶段条目 6b–6d：i18n 键层、`useI18n` 调用位置与友链归一化

### 6b i18n 键层

- `i18n/locales/zh-CN/admin-posts.json` 的 **8 个原文级重复键**（`expand*` / `condense*`）去重：`JSON.parse` 会在解析阶段折叠同名键，这两个审计脚本都看不到，只能按原文扫描发现。
- **20 组双源同键**（`pages.admin.<module>.title` 同时存在于 `admin.json` 与 20 个模块文件）收敛为单一来源：保留 `admin.json`（admin 路由的全局模块，菜单在任何管理页都要渲染），从模块文件删除重复键。其中 `admin-calendar` 的页面标题在 4 个语种里与 `admin.json` 取值不同（如 `Content Calendar` vs `Calendar`），说明同键在「菜单」与「页面标题」两种语境下已分叉——按页面语义把更完整的值提升为 `admin.json` 的全局值，菜单与页面标题不再随路由变化。
- 删除 `pages.admin.settings.system.fields.*` **6 个死键**（设置页实际使用 `external_feeds.editor.fields.*`）。
- `home.hero.*` 3 个键经复核**仍在使用**（`pages/index.vue` 的 hero 区 + `pages/index-i18n.test.ts` 断言无 raw key），不予删除；条目立项时的「死键」判断已过期。
- `pages/submit.vue` 的硬编码「支持 Markdown 语法」改用 `pages.submit.form.markdown_help`，五语补齐。
- 结果：`i18n:audit:duplicates` 101 → **99 组**（不增，实际减少 2 组）；`i18n:audit:missing` **0**；`i18n:check-sync` 五语一致；`i18n:verify:runtime` 129 passed。

### 6c `useI18n()` 调用位置

- 复核：`snippet-aggregate-dialog` 与 `creator-stats-panel` 的 `useI18n()` 均已在 `<script setup>` 顶层（前序批次修复），全仓无 setup 内函数体调用。
- 新增守卫 `tests/modules/i18n-setup-usage-guard.test.ts`：扫描 `components/**` / `pages/**` / `layouts/**` 的 `<script setup>`，禁止缩进的 `useI18n()`（即函数体内调用），组合式函数保持合法。已用临时违规文件验证守卫**可判别失败**后删除该文件。

### 6d 友链归一化

- 缺陷：`createFriendLink` / `updateFriendLink` 先 `entity.name = input.name.trim()`，随后 `saveFriendLinkEntity` 的 `assignDefined` 用**入参原值**覆盖，导致首尾空白落库；唯一性校验也会拿到未归一化的 URL。
- 修复：删除预赋值，在 `saveFriendLinkEntity` 的 `assignDefined` 之后统一 `trim`（`name` / `url`），`ensureUniqueFriendLinkUrl` 因此使用归一化后的 URL。
- 新增 2 例断言：创建时 `"  My Blog  "` / `"  https://…  "` 落库为去空白值且唯一性查询用归一化 URL；更新时同样不被覆盖。

### 验证

- `pnpm i18n:verify:runtime`（含 `lint:i18n`）→ **129 passed**（17 文件）。
- `pnpm i18n:audit:missing` → 0；`pnpm i18n:audit:duplicates` → 99 组；`pnpm i18n:check-sync` → 五语 parity 通过。
- `npx vitest run server/services/friend-link.test.ts server/services/friend-link.applications.test.ts` → **53 passed**。
- 新增守卫单测 → 1 passed（并用临时违规文件验证失败路径）。

### 未覆盖边界

- 条目 6a 覆盖率补测单独记入窗口。
- `i18n:audit:duplicates` 仍报 99 组跨模块同文案键，属共享词条（如 `status` / `title`），未在本批收敛；脚本的「原文级重复键扫描」能力仍未上收（backlog 保留）。

<!-- regression-window:end:defects-i18n:第七十一阶段条目 6b-6d i18n 与缺陷治理:2026-11-08 -->

<!-- regression-window:start:b4-d-guards:第七十一阶段条目 5（B4-D）测试与守卫收口:2026-11-08 -->

## 2026-11-08 第七十一阶段条目 5（B4-D）：E2E 断言改写、守卫收口与包体复算

### 范围

- E2E `p-*` 断言 **9 处 / 2 文件 → 0**：`tests/e2e/admin-workflow.e2e.test.ts` 的 6 处 `.p-datatable` → `.caomei-data-table`；`tests/e2e/installation.e2e.test.ts` 的 3 处 `.p-inputtext` `toHaveCount(0)` → `.caomei-input` 存在性断言（原意是「不再渲染 PrimeVue 文本输入」，迁移后等价口径是「渲染 caomei 输入」）。
- 删除 `tests/testSetup.ts` 中已无消费者的 PrimeVue `useToast` / `useConfirm` mock（全仓零 `from 'primevue/useToast'` 引用）。`tests/plugins/primevue-i18n.test.ts` 保留：插件按 roadmap 第七十二阶段随 PrimeVue 卸载删除。
- 守卫收口：
    - `resolvePageFile` 增加动态参数页回退（目录内唯一 `[param].vue`），支持 `/goto` → `pages/goto/[code].vue`；
    - `listSubRoutePages` 排除页面文件自身，根前缀 `/` 不做子路由枚举（根前缀只精确匹配 `/`，新增断言防止「登记根 = 全站切库」）；
    - 登记 `/` 与 `/goto` 两条 scope；`CAOMEI_UI_ROUTE_PREFIXES` 由 33 → 35 条，全站路由登记完成。
- 包体复算：`keyCss` 63,337 B（61.85KB / 70KB）、`coreEntryJs` 375,368 B（366.57KB，超原 365KB 配额 1,608 B）、`maxAsyncChunk` 55.45KB / 130KB。
    - 归因：条目 4 把全局头部管理菜单的 16 个 lucide 图标带入入口 chunk（+6,156 B，`prIncrementJs` 归零）。延后加载菜单图标会让首次展开时缺图标（可见劣化），故按「先评估优化或重新定标」条款把配额 365 → 370KB（378,880 B，余约 3.4KB），同步 `scripts/perf/check-bundle-budget.mjs` / `.github/perf/bundle-baseline.json` / `docs/standards/performance.md` 三处；第七十二阶段卸载 PrimeVue 后复测并收紧。

### 验证

- `pnpm typecheck` 0；ESLint 0 error；Stylelint 0。
- 守卫：路由守卫 **70 passed**、过渡组件收口守卫 **4 passed**。
- `pnpm test:e2e:critical` **17 passed / 1 skipped** + 安装向导 **2 passed**。
- `pnpm test:perf:budget`：`coreEntryJs` 366.57KB / 370KB、`keyCss` 61.85KB / 70KB、`prIncrementJs` 0.00KB / 20KB（通过）。
- `pnpm test:visual` 24/24、`pnpm test:visual:parity` 83/83（同日条目 4 批次内复跑）。

### 未覆盖边界

- 全量 `pnpm test` 本地仍受 25 个既有 `virtual:intlify-i18n` suite 失败影响（HEAD 同样失败，CI 不复现），本批未新增失败面。
- `tests/e2e/admin-workflow.e2e.test.ts` 的用例全部为历史 `test.skip`，选择器改写只影响治理计数口径，不改变运行时覆盖。
- `plugins/primevue-i18n.ts` 与其单测保留至第七十二阶段（PrimeVue 卸载同批），因此「vitest PrimeVue mock 文件数」为 1 而非 0。

<!-- regression-window:end:b4-d-guards:第七十一阶段条目 5（B4-D）测试与守卫收口:2026-11-08 -->

<!-- regression-window:start:b4-c-icons:第七十一阶段条目 4（B4-C）图标全量替换:2026-11-08 -->

## 2026-11-08 第七十一阶段条目 4（B4-C）：`pi pi-*` 全量替换与品牌图标落点

### 范围

- 全仓 `pi pi-*` 文本命中 **136 处 / 40 文件 → 0**（脚本口径 `pnpm governance:count:primevue-usage` 图标 0），生产代码约 110 处、注释与测试断言 18 处。
- 非品牌图标 → `@lucide/vue`，按原 CSS `font-size` 传等价 `:size`（0.7rem→11、0.75rem→12、0.875rem→14、1rem→16、1.25rem→20、1.5rem→24、2rem→32、3rem→48）。
- **数据驱动图标改为组件**：`composables/use-admin-menu-items.ts`（23）、`utils/shared/commercial.ts`（14）、`utils/shared/ai-admin.ts`（5）、`utils/shared/share.ts`（3）、`utils/shared/social-post-platforms.ts`（2）。新增 `utils/shared/brand-icons.ts`：`createClassIcon()`（渲染 `<i class="…">`）、`BRAND_ICONS`、`rawIcon()`（`markRaw` 规避响应式代理告警）。
- 消费方统一用 `<component :is>`：`app-header`（删除 `resolvePrimeIcon` / `toDropdownModel` 类名适配）、`article-share`、`article-sponsor`、`commercial-link-{section,manager,dialog}`、`post-social-dialog`、`admin/ai/task-list` 等。
- 旋转图标（`comment-list` 的加载态）改 `LoaderCircle` + 组件内关键帧；`error.vue` 的两个 PrimeVue `Button` 保留组件、图标改 `#icon` 插槽内的 lucide。

### 品牌图标落点（11 类）

| 品牌 | 落点 | 说明 |
| :--- | :--- | :--- |
| github / google / twitter / linkedin / youtube / twitch / instagram / facebook | `@mdi/font` 的 `mdi mdi-*` 类名 | 字体已全局加载，零新增依赖 |
| tiktok / discord / paypal | `utils/shared/brand-icons.ts` 内联 Simple Icons（CC0）SVG | 实测 `@mdi/font@7.4.47` 未收录这三个类名（已 grep 产物 CSS 核验），用内联路径保持品牌外观 |

### 差异归因（parity 允许清单按实测登记）

| 用例 | 未归因差异（归因前） | 归因 |
| :--- | :--- | :--- |
| `home-*` | 2,830 / 2,871px（预算 2,000） | 文章卡片元信息与「阅读更多」图标改 lucide 后行内盒宽差（PrimeIcons 1rem 下 advance ≈12.45px、行盒 16px，lucide 为 14px 方形盒），使文本出现 1–2px 水平位移；卡片结构 / 文案 / 换行未变。登记 160,280 360×160 与 160,720 360×120。 |
| `posts-list-*` | 5,241 / 5,289px | 同上（水平卡片整体 3px 内位移）+ 分页器箭头图标字形差异。登记 560,120 320×240 与 560,800 480×80。 |
| `post-detail-*` | 元信息行 1,799 / 1,721px | 头像 / 分类标签 / 日期行内的图标盒宽差；按实测回填既有条目。 |
| `admin-theme-settings-*`（`test:visual` 基线层） | 890 / 885px | 主题工作台预览卡内的文章卡片元信息图标形状差异，按迁移后观感重采两张基线。 |

### 顺带修复（测试确定性）

- **种子文章发布时间漂移**：`server/utils/seed-test.ts` 原用 `new Date()`，TEST_MODE 每次启动用内存库重新种子，参考态里的日期文本随运行日变化。`home` / `posts-list` 移入已迁移清单后，日期漂移被当成组件差异报出。改为固定 `2026-11-06T04:00:00.000Z`（与参考态采集日一致），后续运行日期文本稳定。

### 验证

- `pnpm typecheck` 0；ESLint 0 error（`admin-taxonomy-page` 911 行 `max-lines` 为既有 warning）；Stylelint 0。
- 定向单测：29 + 10 + 9 个文件 **454 passed**（含 `tests/modules/*guard*`、commercial / share / ai-admin、各页面与组件）。
- `pnpm test:visual` **24/24**（重采 `admin-theme-settings-light/dark` 两张基线）。
- `pnpm test:visual:parity` **83/83**（18.1 分钟）。
- 复算：组件 **46 处 / 14 类**（图标批同时去掉 `error.vue` 之外的 1 处假阳性 `Calendar` 误计）；图标 **0**；token 1,420。

### 已接受的差异

- 图标字形由字体图标改为 lucide 描边图标，视觉形状必然变化；尺寸按原字号等价换算，未做视觉重设计。
- `pages/benefits.vue` 的 i18n `premium.items[].icon` 字段不再参与渲染（图标改为组件映射），为避免多语言文件联动暂不删除，登记为后续清理项。

### 未覆盖边界

- `@mdi/font` 未收录 tiktok / discord / paypal，后续升级字体后可替换为 `mdi mdi-*` 类名。
- `error.vue` 仍使用 PrimeVue `Button`（仅图标改 lucide），组件迁移不在本条目范围。

<!-- regression-window:end:b4-c-icons:第七十一阶段条目 4（B4-C）图标全量替换:2026-11-08 -->

<!-- regression-window:start:b4-b-public-routes:第七十一阶段条目 3（B4-B）公开路由与过渡组件收口:2026-11-08 -->

## 2026-11-08 第七十一阶段条目 3（B4-B）：公开路由整迁与过渡组件收口

### 范围

- 公开路由 8 个页面文件 + 1 个共享页组件，共 **61 处**：
    - `pages/index.vue`（9 处）：加载骨架 → `CaomeiSkeleton`。
    - `pages/posts/index.vue`（3 类）：骨架 → `CaomeiSkeleton`；错误条 → `CaomeiMessage`；`Paginator` → `CaomeiPaginator`（切 1 基 `page` + `@update:page` 接收页码，删除 `first` 同步 watch）。
    - `pages/posts/[id].vue`（13 处）：`Skeleton` ×5 → `CaomeiSkeleton`；错误 / 解锁 / 登录按钮 → `CaomeiButton`；状态条 → `CaomeiMessage`；分类 / 标签 → `CaomeiTag`；密码输入 → `CaomeiInput`（`@keyup.enter` → `@enter`）；14 处图标 → `@lucide/vue`。
    - `pages/friend-links.vue`（18 处）：`Card` ×3 → `CaomeiCard`；`Tag` → `CaomeiTag`（`severity` → `tone`）；`InputText` ×8 → `CaomeiInput`；`Select` / `Textarea` ×2 / 提交 `Button` 一并迁移，移除 `fluid` 与字符串 `rows`。
    - `pages/archives/index.vue`（2）+ `pages/categories/index.vue` / `pages/tags/index.vue`（各 2：`Message` + `Skeleton`）+ `pages/goto/[code].vue`（3 按钮 + `ProgressSpinner`）+ `components/legal-agreement-page.vue`（`Tag` ×2 + `Divider`）。
- 路由 scope 登记 **7 条**：`/archives` / `/categories` / `/tags` / `/posts` / `/friend-links` / `/privacy-policy` / `/user-agreement`；`/about` / `/benefits` / `/feedback` 无页面组件（共用 `legal-agreement-page`），仅登记 parity 迁移状态、不登记 scope。
- parity：`MIGRATED_ROUTES` 扩到 **41 条**，`PENDING_ROUTES` **清零**（机制保留）。
- 过渡组件收口：`AppAvatar` / `AppUploader` / `AdminContentLanguageSwitcher` 删除路由择库分支（`resolveUiLibraryForRoutePath`），删除 3 个 V1 文件；`app-avatar-v2` / `app-uploader-v2` / `content-language-switcher-v2` 与 posts 三件套共 6 组去掉 `-v2` 后缀（文件、`import`、模板标签、测试 mock、`ownedFiles`）。`ui-library-transition-component-guard` 由「过渡组件结构守卫」改写为「收口守卫」。

### 差异归因（parity 允许清单按实测登记）

| 用例 | 未归因差异（归因前） | 归因 |
| :--- | :--- | :--- |
| `post-detail-light` / `-dark` | 2,598 / 2,470px（预算 2,000） | 文章元信息行（头像 / 分类标签 / 日期 / 阅读数 / 字数）：头像切 caomei 实现、分类标签改 `CaomeiTag` 后行盒高度变化，导致该行 1px 级重排；正文与其它区域残差 0。登记区域 480,220 960×100。 |
| `privacy-policy-*` / `user-agreement-*` | 8,809 / 9,069px | 协议元信息区（版本标签 / 默认提示 / 分隔线）：`CaomeiTag` 的 md 档按控件高度取 36px，而 PrimeVue `Tag` 行盒约 23px，整块下移后正文随之重排。处置走通道① `--caomei-tag-height: 23px` 覆盖（实测分隔线 y=406/407、正文首行与参考态一致），残差为区外 0；登记区域 320,240 800×180。 |
| `friend-links-light` / `-dark` | 28,251 / 27,412 + 9,204 / 9,371px | 友链卡片与申请表单整块：`Card` / `Tag` / `InputText` / `Select` / `Textarea` / `Button` 外壳、间距与字段高度统一到 caomei 后的期望差异（表单占满页宽）。登记区域 0,400 1440×400 与 160,800 1280×100。 |
| `admin-snippets-list-light` / `-dark`（外围组件批连带） | 2,979（原 1,942）/ 9,467（原 3,928）+ 79（原 30） | `/admin/snippets` 的 `SnippetQuickCapture` 卡片内含 `AppVoiceInputTrigger`，该按钮在外围组件批改为 caomei `CaomeiButton` + lucide 后改变卡片与下方网格的整体行高（dark 另含按钮文字色差异）。按实测校准既有允许清单，未新增区域。 |

### 验证

- 定向单测：公开路由 5 个页面测试 + 3 个 i18n 测试 **44 passed**；友链页 **15 passed**；共享壳与收口守卫 **128 passed**；路由守卫 **66 passed**；关联消费方 **83 passed**。
- `pnpm typecheck` 0；ESLint 0 error；Stylelint 0；`lint-md` 0。
- `pnpm test:visual` **24/24**；`pnpm test:visual:parity` **83/83**（18.1 分钟，41 条已迁移 + 安装向导 + 待迁移机制用例）。
- `pnpm test:e2e:critical`：17 passed / 1 skipped + 安装向导 2 passed（三浏览器）。
- 复算：组件 **108 → 47 处 / 21 → 15 类**；图标 **161 → 136**；token 1,420 不变（第七十二阶段处理）。

### 已接受的视觉 / 行为差异

- 法务协议页版本标签高度按 23px 覆盖以保持正文位置；属 token 通道①，不引入选择器级覆盖，后续 `CaomeiTag` 若调整 md 档高度需复核该值。
- 友链申请表单的字段间距、卡片内边距与按钮尺寸随 caomei 组件统一；表单结构、校验与提交载荷未变。
- `posts` 列表分页器改为 caomei 外观（1 基页码事件），URL 契约 `?page=N` 不变。
- 头像 / 上传字段不再是「按路由择库」，公开页与 admin 使用同一实现；`/admin/posts/[id]` 的媒体设置同步切到该实现（原 V1 分支删除）。

### 未覆盖边界

- 首页 `/` 与跳转页 `/goto/[code]` 暂不登记路由 scope：守卫的 `prefix !== '/'` 断言与 `resolvePageFile` 只识别 `pages/<prefix>/index.vue` / `pages/<prefix>.vue`（不识别 `[code].vue`），留条目 5 与守卫口径一并收口。
- `app-uploader.scss` 仍使用 `--p-primary-*`（PrimeVue 预设仍全局加载），随第七十二阶段预设卸载一并改名，已在文件头登记指针。
- 全量 `pnpm test` 的 25 个本地 i18n suite 失败为既有环境问题（`virtual:intlify-i18n` 解析，HEAD 同样失败），非本批引入。
- 浏览器探针在 10 条公开路由上未见 hydration 警告与 pageerror；但控制台存在既有 `[NUXT_E1001]`（composable 在 setup 外调用），在未改动的 `/admin/comments`、`/login` 上同样出现，判定为批次外问题，建议单独立项定位调用点。

<!-- regression-window:end:b4-b-public-routes:第七十一阶段条目 3（B4-B）公开路由与过渡组件收口:2026-11-08 -->

<!-- regression-window:start:b4-b-content-components:第七十一阶段条目 3（B4-B）公开页内容组件:2026-11-08 -->

## 2026-11-08 第七十一阶段条目 3（B4-B）：公开页内容组件迁移（分享 / 赞助 / 评论 / 订阅 / 阅读控件）

### 范围

- 6 文件 / 31 处：`article-share`（5）、`article-sponsor`（4）、`comment-form`（6）、`comment-item`（5）、`subscriber-form`（5）、`reader-controls`（6）。
- 组件替换：`Button` → `CaomeiButton`（ghost / secondary / icon-only + `#icon`）；`IconField` + `InputIcon` + `InputText` → `CaomeiInput` + `#prefix`；`Textarea` → `CaomeiTextarea`（保留 `autoResize`）；`Tag` → `CaomeiTag`（作者 `primary` / 置顶 `warning` / 语言 `neutral`）；`Message` → `CaomeiMessage`（`severity` → `tone`）；`Slider` → `CaomeiSlider`。图标 **13 处** → `@lucide/vue`。
- `article-sponsor` 的 `Button as="a"` 改为原生 `<a>` + 等价按钮样式，保留新标签页 / 不追踪语义；`comment-item` 头像改用 `AppAvatarV2`（路由未登记时回退 V1，视觉不变）。
- parity：`post-detail` 新增阅读区浮动控件允许清单（light 243px / dark 1,733px）；其余受影响路由（`home`）的差异仍由既有头部 / 反馈入口条目覆盖，未归因残差 < 200px。

### 顺带修复（真实缺陷）

- **scoped `:global(.dark)` 编译形态**：`article-share` / `article-sponsor` 的暗色覆盖写在 `<style scoped>` 的 `:global(.dark)` 块中，编译产物是**裸 `.dark` 选择器**，把 `--caomei-button-text: var(--p-surface-100)` 声明到 `<html>` 上；任何加载该异步 CSS 的页面（实测含 `/admin/settings/theme`）的 caomei 次级 / 幽灵按钮文字色都会变成深色。主题工作台暗色基线差异 2,642px（头部操作区与浮动保存条文字消失）。
- 修复方式：基础选择器改用模式感知 token（`--p-content-border-color` / `--p-text-color`），并删除暗色块中的自定义属性；复测主题工作台暗色差异降至 66px（阈值内），根节点 `--caomei-button-text` 为空。
- 该编译形态在其余 `:global(.dark) .x` 用法上同样存在（产物为裸 `.dark`），本批只修复触碰到的两个文件，其余登记为待治理；陷阱已写入开发规范 §4.6。

### 验证

- 定向单测：6 个组件 **36 passed**；关联页面 / 守卫 **130 passed**（`pages/posts/[id]`、`pages/index`、`pages/posts/index`、`comment-list`、`article-*`、两类守卫）。
- `pnpm typecheck` 0；ESLint 0 error；Stylelint 0。
- `pnpm test:visual` **24/24**；`pnpm test:visual:parity` **83/83**（19.5 分钟）。
- `pnpm test:e2e:critical` **17 passed / 1 skipped** + 安装向导 **2 passed**。
- 复算：组件 **163 → 132 处 / 26 → 23 类**；图标 **189 → 176**；token 1,445 → 1,426。

### 已接受的视觉 / 行为差异

- 评论表单字段、订阅输入框、阅读滑块、分享 / 赞助按钮的外壳与间距随 caomei 组件统一；`article-sponsor` 的链接按钮由 PrimeVue `as="a"` 改为原生 `<a>` + 等价样式（高度 / 圆角 / 边框走 `--caomei-*` token）。
- `comment-item` 语言标签原先的 surface 底色直写被删除，改由 `CaomeiTag` 的 neutral soft 呈现（避免与组件 variant 同特异性竞争）。
- `reader-controls` 的 reset 按钮可访问名复用 `common.refresh`（当前无独立的「重置」i18n 键），未新增键面。

### 未覆盖边界

- 评论 / 分享 / 订阅组件所在的公开路由（`/posts/[id]`、`/`）尚未登记为 caomei 路由，`AppAvatarV2` 仍回退 V1；V1 清零与去 `-v2` 后缀留到公开路由整迁。
- `home/external-feed-panel`、`taxonomy-post-page`、`app-voice-input-*`、`app-uploader` / `app-avatar` 的 V1 消费者仍未处理。
- `:global(.dark)` 编译形态的全仓治理未在本批展开（仅修复触碰到的两个文件并登记规范）。

<!-- regression-window:end:b4-b-content-components:第七十一阶段条目 3（B4-B）公开页内容组件:2026-11-08 -->

<!-- regression-window:start:b4-b-global-shell:第七十一阶段条目 3（B4-B）全局布局壳:2026-11-07 -->

## 2026-11-07 第七十一阶段条目 3（B4-B）：全局布局壳迁移（AppHeader / 搜索 / 通知 / 语言切换 / 反馈入口）

### 范围

- `components/app-header.vue`（17 处：`Button` ×15 / `Divider` ×2）、`app-notifications.vue`（4）、`app-search.vue`（2）、`language-switcher.vue`（1）、`feedback-entry-button.vue`（1）：全部改为 caomei-ui；图标改 `@lucide/vue`（`Menu` / `Calendar` 与 PrimeVue 组件名同名，按别名导入）。
- 全局壳是**所有默认布局页面**共享的渲染面：本批同时影响 29 条已迁移路由与 12 条公开页的头部，以及公开页左下角反馈入口。
- 因共享壳改变，重采 **14 张** `tests/visual` 基线（12 张管理端 + 2 张安装向导），并按实测为 80 条 parity 条目登记头部（公开页另加反馈入口）允许清单；安装向导 6 个区域按新实测回填。

### 顺带修复（B4-B 前置缺陷）

- **CSS `@layer` 层序**：`useHead` 注入的 `#momei-theme-custom` 可能排在外部 `main.css` 之前；若由其中的 `@layer momei-overrides` 先建立层序，`primevue` 会被排到其后并反向胜出，暗色下内容底色取到 Aura 的 `surface.900`（亮色）。实测 `/admin/friend-links` 暗色整页变白（parity 差异 497,229px）；在 `use-theme.ts` 样式串首行补 `@layer primevue, momei-base, momei-overrides;` 后回到 33,436px（仅头部）。
- **E2E 标题选择器**：编辑器迁移后 `.title-input` 是 `CaomeiInput` 根 div，`.fill()` 不再可用；`auth-session-governance` 与 `mobile-critical` 改为 `.title-input input`（`toHaveValue` 同步）。

### 验证

- 定向单测：`language-switcher` / `feedback-entry-button` / `app-notifications` / `app-search` / `app-header` → **5 files / 29 passed**；过渡组件与路由守卫 **76 passed**。
- `pnpm typecheck` 0；`pnpm lint` 0 error / **9 warnings**（预算 10）；`pnpm lint:css` 0；`pnpm lint:i18n` 0。
- `pnpm test:visual` **24/24**（重采后复跑）；`pnpm test:visual:parity` **83/83**。
- `pnpm test:e2e:critical` **17 passed / 1 skipped** + 安装向导 **2 passed**。
- 全量 `pnpm test`：**5,052 passed / 1 skipped**；25 个 suite 因**既有的本地 vitest `virtual:intlify-i18n` 解析问题**失败（在 HEAD 上同样失败，已登记 backlog，CI 不复现）。
- 复算：组件 **188 → 163 处 / 26 类**；图标 **235 → 189 处**；token 1,445（本批 0 变化）。

### 已接受的视觉 / 行为差异

- 头部图标字形与按钮外观：`PrimeVue Button text/rounded` → `CaomeiButton ghost/rounded/icon-only`；图标从 `pi pi-*` 字体改为 lucide SVG，字形轮廓与尺寸略有差异（parity 头部区域逐路由实测 5,870–6,201px，已登记允许清单）。
- 反馈入口按钮：`outlined secondary` → `secondary` 描边；移动端仍隐藏可见文案（由隐藏 `.p-button-label` 改为 `.caomei-button__content`）。
- 安装向导健康检查步骤内的语言切换控件随共享壳改变高度，内容区按区域重分布（已按实测回填 6 个区域）。
- `admin-posts-list` 重采时发现行内「无封面」lucide 图标与旧基线有 1px 级抗锯齿差异（461px）；parity 参考态（迁移前原貌）同一位置差异为 0，判定为旧基线过期而非回归。

### 未覆盖边界

- `app-avatar` / `app-uploader` / `content-language-switcher` 的 V1 消费者尚未清零（公开页与未迁移路由），去 `-v2` 后缀留到条目 3 后续子批。
- 未迁移公开页本体（文章 / 评论 / 首页 / 分类 / 标签 / 归档 / 友链）仍为 PrimeVue；本批只统一了它们共享的布局壳。
- `app-header` 的管理端 / 用户菜单条目图标仍以 `pi pi-*` 类名声明、经 `resolvePrimeIcon` 适配为组件（`CaomeiDropdownMenu` 只接受组件图标）；随条目 4 图标全量替换一并清理。
- 暗色主题的头部差异随路由头部元素显隐在 6,043–6,201px 区间波动，允许清单按逐路由实测登记，不做单值近似。

<!-- regression-window:end:b4-b-global-shell:第七十一阶段条目 3（B4-B）全局布局壳:2026-11-07 -->

<!-- regression-window:start:b4-a-post-editor:第七十一阶段条目 2 编辑器整路由:2026-11-07 -->

## 2026-11-07 第七十一阶段条目 2（B4-A）：文章编辑器整路由迁移

### 范围

- `pages/admin/posts/[id].vue` + `components/admin/posts/**`（19 个组件；编辑器族整批）。
- 组件替换（此前全部为 PrimeVue）：`Button` / `Tag` / `Select` / `InputText` / `Textarea` / `Message` / `Divider` / `Image` / `ProgressSpinner` / `ProgressBar` / `Checkbox` / `Avatar` / `InputNumber`，以及首次生产迁移的 `RadioButton` → `CaomeiRadioGroup` + `CaomeiRadioButton`、`ToggleSwitch` → `CaomeiSwitch`、`AutoComplete`（`suggestions` / `{query}` → `options` / `query`）、`InputGroup`、`SplitButton`（`model` 的 `icon` 由 `pi` 字符串改为 lucide 组件）、`ButtonGroup`、`TagsInput`。
- 三件套收敛：编辑器改用 `post-audit-badge-v2` / `post-audit-dialog-v2` / `publish-push-dialog-v2`；V1 三件套与其两份「两版等价」契约测试**删除**（`post-audit-dialog.contract.test.ts` / `publish-push-dialog.contract.test.ts`），`/admin/posts/[id]` 不再是 V1 消费者。
- 图标：**81 处** `pi pi-*` → `@lucide/vue`（含数据驱动的 `writingMenuItems` / `translateMenuItems` / `REWRITE_STYLES`）。
- 路由登记：`/admin/posts` 新增 `ownedFiles`（19 个组件）、`inScopeComponents`（Textarea / Message / Skeleton / Divider / Image / ProgressSpinner / ProgressBar / Checkbox / RadioButton / ToggleSwitch / AutoComplete / InputGroup / SplitButton / ButtonGroup / Avatar / InputNumber）与 `migratedSubRoutes`（`[id].vue`），删除原 `primeVueSubRoutes`；`/admin` 树根前缀同步把 `[id].vue` 移入 `migratedSubRoutes`。**全仓 `primeVueSubRoutes` 例外清零**。
- 顺带修复（69 阶段遗留）：`CaomeiPopoverTrigger` 会给锚点元素套默认按钮外观，渲染时留下两个 26×36 空盒子（实测顶栏 `#ai-writing-btn` 之后）；用零尺寸/透明规则复位 `rewrite-popover-anchor` / `title-popover-anchor` / `voice-popover-anchor`。
- 结构治理：`post-editor-header.vue` 因迁移从 753 行增至 836 行（越过 ESLint `max-lines` 800 warn 线），把风格数据外置为 `components/admin/posts/post-editor-rewrite-styles.ts`，并把 `severity → tone` 抽为 `utils/shared/ui-tone.ts`（dashboard / 编辑器 / AI 任务详情三处重复实现收敛），最终 798 行；`ai-image-generator.vue` 787 → 819 后清理死样式 / 死类（含 `.p-*` PrimeVue 内部选择器与未使用的 `&__image-wrapper`），最终 799 行。全仓 lint 警告 **9**（低于 10 的预算上限）。

### 验证

- `pnpm typecheck` 0；`pnpm lint` 0 error / **9 warnings**；`pnpm lint:css` 0；`pnpm lint:i18n` 0。
- `npx vitest run components/admin/posts tests/client/components/admin/posts components/admin/ai tests/modules/ui-library-route-migration-guard.test.ts tests/modules/ui-library-transition-component-guard.test.ts` → **16 files / 152 passed**。
- `pnpm build` 通过（最终一次 2m32s）。
- 浏览器探针（build 产物 + TEST_MODE 登录，1600×900，**headless 与 `xvfb-run` headed 两轮**）：`/admin/posts/new` → 200、标题输入框 1、顶栏 **15 个按钮全部为 `caomei-button`**（`i.pi` 计数 0）、设置面板可见、`pageerror` 0；`Languages` / `Pencil` / `Search` / `AlignLeft` 图标渲染正确；两个锚点实测 `0×0`。
- headed 探针（`xvfb-run`，等待 **8s** 后交互）：标签输入「输入 + Enter」成功新增 chip（输入框清空）、语言 `CaomeiSelect` 展开（`aria-expanded=true`）、置顶 `CaomeiSwitch` 切为 `checked`、侧栏「收起」（`--compact`）与「关闭」（`--visible` 与父级 `editor-area--shifted` 同时消失）均正常，`pageerror` 0。
- **探针时序结论（本条对既有记录同样适用）**：编辑器页体积较大，**水合完成需要 6–8s**；3s 内交互会命中未水合的静态 DOM（表现为点击无响应、`CaomeiSelect` 不展开）。此前若在 2–3s 内探测 `/admin/settings`、`/admin/calendar` 的 `CaomeiSelect`，结论同样不可信——判定「headless 下不展开」的两条历史记录应复查；本批的 headed 探针（8s）显示 `CaomeiSelect` 正常展开。
- 管理端 E2E 主路径：`tests/e2e/admin-workflow.e2e.test.ts` **14 passed**、`tests/e2e/admin-posts-shortcut.e2e.test.ts` **4 passed**（首次并行运行有 1 例 firefox 超时，单文件复跑全绿，判定为冷启动抖动）。
- 复算：组件 **370 → 188 处 / 31 → 26 类**；图标 **328 → 235 处**；token 1,445（本批 0 变化）。

### 已接受的视觉 / 行为差异

- 首屏组件基线差异随 caomei 组件统一呈现：`CaomeiButton`（`secondary` = 描边、`ghost` = 无底色）、`CaomeiTag` 的 tone 色板、`CaomeiSwitch` / `CaomeiRadioGroup` 的指示器样式、`CaomeiInput` / `CaomeiSelect` 的字段高度与圆角。`PrimeVue` 的 `contrast` 语义无对应 tone，统一落 `neutral`（§6.2 有损近似）。
- `SelectButton` 的 `allowEmpty` 语义不适用（整数 / 字符串枚举，无「取消选中」路径）。
- **标签字段改用 `CaomeiTagsInput`**：caomei `AutoComplete` 在多选模式下没有自由文本入口（`onEnter` / `commitFreeText` 直接返回），照搬会**丢失「新建标签」能力**（提示文案「输入标签名称并回车」与服务端 `ensureTags` 都依赖它）。代价是**失去输入时的标签联想下拉**（`search-tags` / `filteredTags` 链路随之删除）；后续若需要「联想 + 新建」二合一，需上游提供带 options 的 tags input。
- **翻译菜单的语言图标**：原 `fi fi-cn` / `fi fi-us` 等旗标类名改为统一的 lucide `Languages`（caomei `DropdownMenuModelItem.icon` 只接受组件，无法传 CSS 类）；菜单项文本仍显示语言名。
- **进度条的条内百分比**：PrimeVue `ProgressBar` 默认在条内渲染 `88%`，caomei `ProgressBar` 无该能力（审计弹窗 7 条与翻译工作流进度条受影响）；百分比数值在每条旁仍有文本，信息未丢失。
- `AutoComplete` 的 `#option` / 值形状按 caomei 契约重写；`post-editor-settings` 的标签建议与翻译来源搜索仍在 `complete` 事件里把字符串包成 `{ query }`，与既有 composable 契约一致。

### 未覆盖边界

- `/admin/posts/[id]` 无 parity 基线（无稳定种子 id；新建态默认展开设置面板、无 heading）；本批以组件测试 + 浏览器探针 + E2E 覆盖。既有文章编辑页未做浏览器截图（TEST_MODE 种子库无文章，列表为空）。
- 暗色主题未单独截图；下拉 / 浮层的真实展开在 headless 探针中仍无法触发（与 `/admin/settings`、`/admin/calendar` 同一既有环境行为）。
- **既有缺陷，未在本批修复**：`publish-push-dialog-v2` 的排期仍用 PrimeVue `DatePicker`（B3 表单族，随 B3 残留族收口）；`/admin/marketing` 与 `/admin/migrations/link-governance` 的 `Card` / `ProgressSpinner` 残留同属 B3 / B4 收口。
- **本地环境限制**：`utils/shared/post-copyright.ts` 的 locale JSON 导入在本地 vitest 下会报 `Cannot find module '/@id/virtual:intlify-i18n-N'`（已登记 backlog；`utils/shared/post-copyright.test.ts` 同样受影响，与本次改动无关）。`post-editor-header.test.ts` 通过模块级 mock 掉 `post-distribution-button.vue` 绕开该传递依赖，本地可正常执行（该 mock 与 `global.stubs` 并存，属已登记的测试技术债）。
- **提交规模**：本批 **46 个变更文件**（38 修改 + 5 删除 + 3 新增）/ 约 +1400 行，超出「≤10 文件」的常规粒度。**拆分依据**：编辑器是**单个路由**，`pages/admin/posts/[id].vue`、19 个路由自有组件与 V1 三件套的删除必须在同一点落库——先迁一半会让该路由同时运行两套库（违反「不做半路由切换」），先删 V1 会让页面引用空模块（编译失败）。测试与文档同批是为了让「登记 / 断言 / 证据」与实现保持同一可复算基线。

<!-- regression-window:end:b4-a-post-editor:第七十一阶段条目 2 编辑器整路由:2026-11-07 -->

<!-- regression-window:start:b4-a-admin-dashboard:第七十一阶段条目 2 仪表盘整路由:2026-11-07 -->

## 2026-11-07 第七十一阶段条目 2（B4-A）：仪表盘 `/admin` 整路由迁移

### 范围

- `pages/admin/index.vue` + `components/admin/dashboard/{metric-card,creator-metric-card,creator-stats-panel}.vue`。
- 组件替换：`Button` → `CaomeiButton`（刷新，`loading` + lucide `RefreshCw`）；Tabs 族 → `CaomeiTabs` + `CaomeiTabTrigger` / `CaomeiTabContent`（`unmount-on-hide=false` 保留创作面板已加载状态）；范围筛选 `Select` → `CaomeiSelect`（`:model-value` + 收窄回写，避免把 `string | number | null` 直接写进 `'all' | 'public'`）；10 处 `Tag` → `CaomeiTag` 走 tone（页面 5 + 创作面板 4 + 指标卡 1；`secondary` / `contrast` → `neutral`、`info` → `primary`、`warn` → `warning`）；`ProgressSpinner` → `CaomeiProgressSpinner`；3 张排行卡 + 3 张指标卡 `Card` → `CaomeiCard`（`#content` → 默认插槽）；**17 处** `pi pi-*` → `@lucide/vue`（页面 12 + 创作面板 5）；`icon` prop 由字符串改为组件（`metric-card` / `creator-metric-card`）。
- 样式：`.dashboard-metric-card` 与 `.admin-dashboard__ranking-card` 的描边 / 背景改走 `--caomei-card-border` / `--caomei-card-bg` 覆盖钩子——直接写 `border` / `background` 与 `.caomei-card--outlined[data-v-*]` **同特异性**，胜负取决于样式表加载顺序（跨 chunk 不确定），实测用钩子后稳定生效（描边 `1px solid`、渐变背景保留、图标右对齐距卡右内侧 17px）。
- 路由登记：`CAOMEI_UI_ROUTE_SCOPES` 新增 `/admin`（树根前缀），`ownedFiles` 三个 dashboard 组件、`inScopeComponents` 仅 Tabs 族；`migratedSubRoutes` 登记 22 个已迁移的管理端子页面、`primeVueSubRoutes` 保留编辑器 `/admin/posts/[id]`。
- 测试：新增 `pages/admin/index.test.ts`（5）、`components/admin/dashboard/metric-card.test.ts`（4）、`creator-stats-panel.test.ts` 补 3 例 = **新增 12 例**。`creator-stats-panel.test.ts` 同时把 mock 的 `stats` 从普通对象改为真正的 `ref`：旧形状下模板 `v-else-if="stats"` 为真（指标卡仍渲染），但 computed 里的 `stats.value` 为 `undefined`，`hasTrendData` / `hasDistributionData` / `granularityLabel` 永久走空分支——**排行 / 趋势区从未被覆盖**；修复后该区才有真实断言。

### 验证

- `pnpm typecheck` 0；`pnpm lint` 0 error；`pnpm lint:i18n` 0；`pnpm lint:css` 0；`pnpm build` 通过（2m28s）。
- `npx vitest run components/admin/dashboard pages/admin/index.test.ts tests/modules/ui-library-route-migration-guard.test.ts tests/modules/ui-library-transition-component-guard.test.ts` → **6 files / 100 passed**（分文件实测：dashboard **19** / 页面 **5** / 路由守卫 **60** / 过渡守卫 **16**；逐文件复算：`npx vitest run components/admin/dashboard`、`npx vitest run pages/admin/index.test.ts`、`npx vitest run tests/modules/ui-library-route-migration-guard.test.ts`、`npx vitest run tests/modules/ui-library-transition-component-guard.test.ts`）。
- 计数复算命令（**钉迁移前提交 `f63b7639`**，否则本次提交后 `HEAD` 前移、命令返回 0）：`git show f63b7639:pages/admin/index.vue | grep -o 'pi pi-[a-z-]*' | wc -l` → 12；`git show f63b7639:components/admin/dashboard/creator-stats-panel.vue | grep -o 'pi pi-[a-z-]*' | wc -l` → 5；`git show f63b7639:pages/admin/index.vue | grep -c '<Tag\b'` → 5。
- 浏览器探针（build 产物 + TEST_MODE 登录，1440×900）：`/admin` → 200、h1「内容洞察」、`role=tab` 2 条、`CaomeiCard` 3 张（指标卡）、`CaomeiTag` 8 个、`pageerror` 0；指标卡实测描边 / 渐变 / 图标右对齐均正确；创作页签切换后无报错。
- 复算：组件 **398 → 370 处 / 36 → 31 类**；图标 **352 → 328 处**；token 1,445（本批 0 变化）。

### 已接受的视觉 / 行为差异（无 parity 基线，人工核对）

- `Card` → `CaomeiCard` 的组件基线差异：阴影消失（PrimeVue Aura `0 1px 3px rgb(0 0 0/.1)` → caomei `--outlined` 无阴影）、body 内边距 `20px → 16px`、标题 `20px/500 → 16px/600`。影响 6 张卡（3 指标 + 3 排行）与创作面板 2 张卡的标题；描边与渐变背景已用 `--caomei-card-*` 钩子显式保留。
- `Tabs` 面板挂载时机：PrimeVue `TabPanel` 未设 `lazy` 时首屏即渲染，reka `TabsContent` 走 `Presence`，`unmount-on-hide=false` 只保证**首次激活后**不卸载——创作面板的 `onMounted` 取数因此从「页面加载即请求」变为「首次点击创作页签才请求」。功能无回归（少一次首屏请求），但属行为差异；面板未挂载时 `creatorRefreshSignal` 自增会丢失（当前交互不可达：无页签外的刷新入口）。
- 「迁移前后无像素对照」：`/admin` 的指标窗口按运行时「最近 N 天」计算，参考态跨日即漂移，故无 parity 基线。

### 未覆盖边界

- `/admin` 不进跨日 parity 基线（指标窗口按「最近 N 天」运行时计算），本批以组件测试 + 浏览器探针替代；无「迁移前 / 迁移后」像素对照。
- 创作页签在浏览器探针中只到「空状态」：`/api/admin/creator-stats` 在 SQLite 下 `range=30` 返回 500（`no such function: DATE_TRUNC`，PostgreSQL 专有函数），属**既有后端缺陷**，已登记 backlog 待跟踪；卡片 / 趋势 / 分发标签的渲染由组件测试（含 `CaomeiCard` / tone 断言）覆盖。
- 指标卡网格在 1440px 下为单列（`.admin-dashboard__metrics` 计算宽 1312px）：`_admin-dashboard.scss` 末尾 `respond-to("md")`（`min-width`）把三列布局压成 `1fr`，与基础规则矛盾，属**既有布局缺陷**（本批未改该媒体查询），已登记 backlog。
- 暗色主题未单独截图；下拉展开在 headless 探针中仍无法触发（与 `/admin/settings`、`/admin/calendar` 同一既有环境行为）。

<!-- regression-window:end:b4-a-admin-dashboard:第七十一阶段条目 2 仪表盘整路由:2026-11-07 -->

<!-- regression-window:start:b4-a-calendar:第七十一阶段条目 2 内容日历整路由:2026-11-07 -->

## 2026-11-07 第七十一阶段条目 2（B4-A）：内容日历整路由迁移

### 范围

- `/admin/calendar` + `components/admin/calendar/{calendar-view,kanban-view}.vue`。
- 组件替换：Tabs 族 → `CaomeiTabs` + `CaomeiTabTrigger` / `CaomeiTabContent`（模板 `#panel` → 子组件）；语言选择 `Select` → `CaomeiSelect`（size `sm`）；月历工具栏两枚 icon-only 按钮（lucide Chevron）+ Today 按钮；视图切换 `SelectButton`；加载态统一 `CaomeiProgressSpinner`；看板计数 `Tag` → `CaomeiTag`（tone `primary`）。
- 路由登记：`CAOMEI_UI_ROUTE_SCOPES` 新增 `/admin/calendar`（`ownedFiles` 两视图 + Tabs 族 / `SelectButton` / `ProgressSpinner` 增量）。

### 验证

- 单测：`pages/admin/calendar/index.test.ts`（3）+ `calendar-view.test.ts`（3）+ `kanban-view.test.ts`（3）= **迁移新增 9 passed**；既有 `tests/client/.../calendar-view.test.ts` **9 passed 保留**；guard **59 passed**。
- 浏览器探针（build 产物 + TEST_MODE 登录）：`/admin/calendar` → 200、h1「内容日历」、`role=tab` 2 条、看板 3 列、`pageerror` 0。
- 复算：组件 411 → **398 处 / 36 类**（本批消除 calendar 路由的 1 处 lucide `Calendar` 假阳性；398 仍含 marketing 路由 1 处既有假阳性，真实 PrimeVue 组件面 397）；图标 358 → **352 处**；token 1,445（本批 0 变化）。
- 未纳入跨日 parity：日历「今天」高亮与当月网格跨日 / 跨月不可复现，按条目 1 的判定改用组件测试 + 探针覆盖。
- 修复（Round 1 审计）：`CaomeiSelect` 丢弃 `null` 值选项 → 语言筛选改用非空哨兵 `'__all__'`（空串会触发 reka `SelectItem` 断言）并在回写时还原 null（「全部语言」恢复可选）；`CaomeiTabs` 补 `:unmount-on-hide="false"` 保留月历状态；prev / next 改用 `pages.admin.calendar.prev_period` / `next_period`（5 语言）；页面测试补语言哨兵与页签切换用例。

### 未覆盖边界

- 月历网格在 TEST_MODE 无文章数据时页面持续显示「加载中」（`calendarLoading` 由 setup 顶层 `void loadData()` 驱动，SSR 与 hydration 时序既有行为；迁移未改该逻辑），未做 HEAD 对照验证；登记为观察项。
- 月历 / 看板无截图基线；看板卡片拖拽与更新阶段路径未在浏览器验证（原有 E2E 未覆盖）。

<!-- regression-window:end:b4-a-calendar:第七十一阶段条目 2 内容日历整路由:2026-11-07 -->

<!-- regression-window:start:b4-a-ai-task:第七十一阶段条目 2 AI 任务详情整路由:2026-11-06 -->

## 2026-11-06 第七十一阶段条目 2（B4-A）：AI 任务详情与共享内容组件迁移

### 范围

- `/admin/ai/tasks/[id]` 整路由：Button / ProgressSpinner / Message / Card + `AdminAiTaskDetailContent`。
- 共享组件：`task-detail-content.vue`（Tag ×3 走 tone、复制按钮、错误 Message、AI 图片包装层）、`task-details-dialog.vue`（ProgressSpinner / Message）、`stats-overview.vue`（5 个 Card + 9 图标）、`metric-card.vue`（Card；`icon` prop 由字符串改为组件）。
- 路由登记：`AI_ROUTE_SCOPE` 移除 `primeVueSubRoutes`，加 `migratedSubRoutes`（任务详情）、`ownedFiles`（task-detail-content）与 `inScopeComponents`（Card / Message / ProgressSpinner / Image）。

### 验证

- parity admin-ai **4 passed**：stats-light 23,503px（2 区域）、stats-dark 24,127px（2 区域）、tasks-list-light 23,542px、tasks-list-dark 26,961px；stats 两条的第二区域按实测复校（24,879→21,377 / 25,661→21,972），未归因 0。
- 详情页错误分支探针：`/admin/ai/tasks/nonexistent-id` → 200，h1「AI 任务详情」，`CaomeiMessage` 显示 "Task not found"，pageerror 0。
- `npx vitest run components/admin/ai "pages/admin/ai/tasks/[id].test.ts"`：**8 passed**（内容 5 + 页面三态 3）；guard 58 passed；`typecheck` 0；`build` 通过（3m05s）。
- 修复（Round 1 审计）：`CaomeiCard` 的 `#title` 内 `space-between` 失效（heading 宽度塌缩）→ 指标卡与告警卡改用 `#extra` 插槽承载图标；补充 Tag tone 顺序断言与页面三态测试；`metric-card` 恢复 CRLF；迁移方案例外清单同步（AI 子路由转正）。
- 复算：组件 429 → **411 处 / 36 类**；图标 374 → **358 处**。

### 未覆盖边界

- `/admin/ai/tasks/[id]` 正常数据态无种子任务，未做浏览器截图；由组件测试与错误分支探针覆盖。
- parity 参考态仍为迁移前 PrimeVue；stats-overview 迁移后的差异按实测归因，未重采参考态。

<!-- regression-window:end:b4-a-ai-task:第七十一阶段条目 2 AI 任务详情整路由:2026-11-06 -->

<!-- regression-window:start:b4-a-snippets:第七十一阶段条目 2 灵感收纳箱整路由:2026-11-06 -->

## 2026-11-06 第七十一阶段条目 2（B4-A 首批）：灵感收纳箱整路由迁移

### 范围

- `/admin/snippets` + `/admin/snippets/capture` 整路由（7 文件：5 组件 + 2 页面）：`snippet-card` / `quick-capture` / `edit-dialog` / `bookmarklet` / `aggregate-dialog` + 两个页面。
- 组件替换：Button（icon-only + lucide `#icon`）、Tag（tone + 默认插槽）、Checkbox（数组模型）、Paginator（1 基 `page` + 自渲染页码报告，`useAdminList` 加 `pageIndexBase: 1`）、Textarea / Select / SelectButton / InputNumber / Divider / Card / Image / Accordion 族；图标 30+ → `@lucide/vue`（`pi-spin` → `LoaderCircle` + 本组件动画）。
- 路由登记：`CAOMEI_UI_ROUTE_SCOPES` 新增 `/admin/snippets`（`ownedFiles` 5 个组件 + `migratedSubRoutes` capture）。

### 验证

- `pnpm test:visual:parity`（仅 4 条，**样式修复后重测**）：**4 passed**；list-light 17,628px / list-dark 18,318px / capture-light 9,087px / capture-dark 9,410px，全部由 allowlist 按实测扣减，未归因 0。修复前 list-dark 为 73,535px（快捷采集卡片高度塌缩导致），修复 textarea 内层控件后回落。
- `npx vitest run pages/admin/snippets/index.test.ts components/admin/snippets tests/modules/ui-library-*-guard.test.ts tests/scripts/parity-budget.test.ts`：**7 files / 98 passed**（页面 5 + 组件 10 + 守卫 74 + 预算 9）。
- `ui-library-route-migration-guard` + transition guard：**74 passed**（路由守卫 58 + 过渡组件 16）。
- `pnpm typecheck` 0；`pnpm lint` 0 error；`pnpm build` 通过（2m27s）。
- 页面结构探测（Playwright + admin storage）：h1、聚合按钮 disabled、空态、capture 标题 / textarea / Tag 均正常，`pageerror` 0。

### 修复（Round 1 审计）

- 补 5 个语言包 `common.back`（返回按钮可访问名）；
- `CaomeiTextarea` 内层 control 的 flex / 高度 / 字号 / 行高（capture 20px、quick-capture 18px、edit 16px）；
- 缩略图补 `.caomei-image` 根节点尺寸；
- 聚合弹窗移除 `useI18n()` 内联调用（改用 setup 顶层 `locale`，避免事件处理器内抛错）；
- parity allowlist 按互斥连通区域重登记（list-dark 改为 4 个 allowlist 区域（5 个连通域），声明值 = 各区域实测）。

### 未覆盖边界

- 非空片段列表的分页交互未用真实数据验证（TEST_MODE 无片段种子），分页转换由单测覆盖。
- E2E 补跑计划：`tests/e2e` 无 snippets 专用 spec，随下一次 `regression:weekly` / 管理端 E2E 补跑 `/admin/snippets` 主路径；本窗口不以探针替代 E2E 证据。
- list-dark 修复前 73,535px 中约 55,000px 来自快捷采集卡片高度塌缩（内层 `textarea` 仅 45px）；修复后降至 18,318px，剩余为卡片 / 折叠面板内边距与暗色底色差异。
- capture 的差异由 5,620 / 5,956 增至 9,087 / 9,410：文本域修复为填满容器后，外观差异区域随之扩大，属结构正确后的真实差异。

<!-- regression-window:end:b4-a-snippets:第七十一阶段条目 2 灵感收纳箱整路由:2026-11-06 -->

<!-- regression-window:start:b4-item-1-baseline:第七十一阶段条目 1 B4 开工基座:2026-11-06 -->

## 2026-11-06 第七十一阶段条目 1：B4 开工基座与参考态采集

### 范围

- 现取复核：未迁移页面 **19 个 / 页面口径 90 处**（剥离注释 89 处）；脚本口径组件 **482 处 / 40 类 / 82 文件**。
- 参考态：`PENDING_ROUTES` 登记 **14 条**（管理端 2 + 公开页 12），HEAD 采集 **28 张**；`/admin` 与 `/admin/calendar` 因运行时日期窗口 /「今天」高亮不纳入，另 5 条动态 id / 无种子路由不纳入（2 条日期型 + 2 条动态 id + 3 条无种子 = 7 条路由，清单表内 6 行）；`/privacy-policy`、`/user-agreement` 按默认 agreement 兜底纳入。
- 门禁基建：`gotoWaitUntil` 支持（外部头像阻塞 `load`）；heading 等待改为 `exact: true` + `.first()`（保留 `.first()` 作为精确同名时的 DOM 顺序兜底）；`--only` 改为后缀锚定，避免 `posts-list` 误命中 `admin-posts-list`。
- 在册族：全局扩族会使 **8 条已收口路由**判红（合法残留），改为随条目 2 / 3 路由整迁登记 `inScopeComponents`，B3 残留族另行收口后再并入全局基准；清单见 [B4 迁移清单](../../design/governance/2026-11-06-b4-migration-inventory.md)。

### 验证

- `pnpm test:visual`：**24 passed**（4.7m）。
- `pnpm test:visual:parity`：**83 passed**（82 条比对 + 1 条安装路由登记守卫，18.5m），新 28 条实测 0px / 0.000%。
- `npx vitest run tests/scripts/capture-visual-reference.test.ts tests/scripts/parity-budget.test.ts tests/modules/ui-library-route-migration-guard.test.ts`：**74 passed**。
- `pnpm typecheck` 0；`pnpm lint` 0 error（9 个既有 warning）；`lint-md` 通过。
- 误采修复：`--only=posts-list` / `friend-links` 曾子串命中已迁移路由并覆盖 4 张参考态，已恢复原图与 manifest 记录；`--only` 已改为后缀锚定并补单测。

### 未覆盖边界

- `/admin`、`/admin/calendar`、`/admin/posts/[id]`、`/admin/ai/tasks/[id]`、`/categories/[slug]`、`/tags/[slug]`、`/goto/[code]` 未纳入 parity；前两者为运行时日期依赖，其余为动态 id / 无种子。
- 新 28 条参考态为「HEAD 当前渲染」，与采集时点绑定；条目 2 / 3 迁移后只比对这些参考态。

<!-- regression-window:end:b4-item-1-baseline:第七十一阶段条目 1 B4 开工基座:2026-11-06 -->

<!-- regression-window:start:periodic-regression:phase-close:2026-11-05 -->
## 2026-11-05 阶段收口前周期性回归（自动回填）

- 执行入口: `pnpm regression:phase-close`
- 证据 artifact: `../../../artifacts/review-gate/2026-11-05-phase-close-regression.md` / `../../../artifacts/review-gate/2026-11-05-phase-close-regression.json`
- 结果摘要: `Pass`；blocker=0，warning=0。
- 已执行验证: test:coverage=PASS，release:check:full=PASS，docs:check:i18n=PASS，docs:check:line-count=PASS，test:perf:budget:strict=PASS，duplicate-code:check:strict=PASS，review-gate:generate:check=PASS
- 回归窗口: 105 行 / 3 条，归档判定=窗口健康。
- Review Gate: `Pass` / `none`；主要问题=无。
- 补充证据: `test:e2e` 单 worker **228 passed**（34.1m）；CI 同提交 `Test` run `42016033169` 的 E2E 1/4–4/4 分片亦全部 success。
- 阈值处置: 首屏 JS 360KB → **365KB**（实测 369,212 B）；重复代码基线 1.22% / 45 clones → **0.5% / 48 clones**（允许 0.65% / 50）；依据见 [2026-11-05 质量门阈值重定标](../../design/governance/2026-11-05-quality-gate-recalibration.md)。
- 环境说明: 此前本地 `seo-regression` 文章详情 `page.goto` 外部资源加载超时，已将该用例改为 `waitUntil: 'domcontentloaded'` 后通过，断言强度不变。
- 未覆盖边界: 无新增未覆盖边界。

<!-- regression-window:end:periodic-regression:phase-close:2026-11-05 -->

<!-- regression-window:start:caomei-locale-wiring:第六十九阶段条目 3 内建文案 locale 接线:2026-11-02 -->

## 2026-11-02 第六十九阶段条目 3 内建文案 locale 接线（`CaomeiConfigProvider` + `registerLocale`）

### 范围

- 新增 `plugins/caomei-locale.ts`：模块顶层静态 import `caomei-ui/locale/{zh-tw,ja-jp,ko-kr}` 并 `registerLocale`；`zh-CN` / `en-US` 由包根预注册，未重复注册。
- `app.vue`：`<CaomeiConfigProvider :locale="caomeiLocale">` 包在 `CaomeiToastProvider` / `CaomeiConfirmDialog` 外层；`caomeiLocale` 由 `composables/use-caomei-locale.ts` 提供（应用 registry 归一化 + `satisfies Record<AppLocaleCode, CaomeiLocale>` 映射，无 `as` 断言）。
- 测试：`tests/plugins/caomei-locale.test.ts`（注册表 / 切换 / 未注册回落 + 告警 / 表格·分页·日期文案键）、`tests/plugins/caomei-locale-ordering.test.ts`（注册晚于 provider 首帧不追溯）、`tests/composables/use-caomei-locale.test.ts`（归一化 / 响应式 / `app.vue` 接线结构）。
- 附带修正：`composables/use-admin-ai-page.test.ts` 的整模块 `vi.mock('caomei-ui')` 改为 `importOriginal`（插件顶层 `registerLocale` 在旧全量 stub 下不存在）。

### 两种注册形态的取舍

| 形态 | 结论 | 依据 |
| :--- | :--- | :--- |
| 静态 import 三门语言（采用） | `coreEntryJs` 353.05KB → **357.41KB**（+4.36KB；三份文件 gzip -9 分别为 1,307 / 1,483 / 1,405 B，合计 4,195 B 仅为单文件参考，入口重压后不可逐字节相加），未越 360KB 配额 | 本轮实测；无首帧阻塞、无切换竞态 |
| 按当前语言异步 import（未采用，未单独构建实测） | 功能上不可选 | `registerLocale` 写入的是普通对象（`dist/locale/index.js`），`provideLocale` 的文案是 `computed` 且只在语言标识变化时重算（`dist/composables/use-locale.js`）。异步注册若晚于 provider 首帧，该语言会一直显示 `zh-CN`；若在语言切换时才 await，切换路径会出现「先回落、后不重算」的竞态。项目内已有 `tests/plugins/caomei-locale-ordering.test.ts` 钉住该契约 |

### 验证结果

- 质量门：`typecheck` 0 error；`lint` 0 error；全量 `pnpm test` **577 passed / 1 skipped（共 578 个测试文件）**；`pnpm build` 成功；`test:visual` **18/18**。
- 包体：`test:perf:budget:strict` 通过——`coreEntryJs` **357.41KB / 360KB**、`maxAsyncChunkJs` 55.45KB / 130KB、`keyCss` 61.79KB / 70KB、`prIncrementJs` 0（基线重取后）。基线三项已按本轮实测重取（`coreEntryJs` 337,008 → 365,988 B、`maxAsync` 49,147 → 56,779 B、`keyCss` 60,896 → 63,270 B），归因写入 `.github/perf/bundle-baseline.json`。
- 浏览器抽查（5 语种，`/admin/users`，无 hydration mismatch）：

| 语种 | Paginator `aria-label` | 「上一页」按钮 |
| :--- | :--- | :--- |
| `zh-CN` | 分页 | 上一页 |
| `en-US` | Pagination | Previous page |
| `zh-TW` | 分頁 | 上一頁 |
| `ja-JP` | ページネーション | 前のページ |
| `ko-KR` | 페이지네이션 | 이전 페이지 |

- 未注册语言回落：`provideLocale({ locale: 'fr-FR' })` 返回 `zh-CN` 文案并在非生产环境输出「未注册」告警（单测覆盖）。

### 未覆盖边界

- `CaomeiDatePicker` 目前无生产使用（日期控件仍是 PrimeVue，随第七十阶段 B3 迁移），故「日期面板」只做到文案键级断言（`datePicker.label` 在 `ja-JP` / `ko-KR` 下分别为 `日付` / `날짜`），未做浏览器面板抽查。
- `ConfirmDialog` 的内建按钮文案同理由单测覆盖（`confirm.confirm`）：现有调用点均显式传 `confirmLabel` / `cancelLabel`，浏览器侧无法触发「未传 label」路径。
- DataTable 空态在浏览器侧未稳定构造（后台列表均有种子数据，`?page=99` 被后端归位到首页），改由文案键断言 + 既有 `Paginator` 实渲染共同覆盖。

<!-- regression-window:end:caomei-locale-wiring:第六十九阶段条目 3 内建文案 locale 接线:2026-11-02 -->

<!-- regression-window:start:overlay-family-migration:第六十九阶段条目 2 浮层族整迁:2026-11-02 -->
## 2026-11-02 第六十九阶段条目 2 浮层族整迁（服务层 / 浮层组件 / v-tooltip）

### 范围

- 服务层：`app.vue` 挂载 `CaomeiToastProvider` / `CaomeiConfirmDialog`，185 处 `toast.add` → `toast.show`、18 处 `confirm.require` → `confirm.confirm` 的 Promise 形态改写；`useToast` / `useConfirm` 仅从 `caomei-ui` 引入。
- 浮层组件：Dialog 39 / Drawer 3 / Popover 5 / Menu 3 / ConfirmDialog 6 全量迁移；6 处生产锚点改声明式触发器或 `useAnchoredPopover`。
- 指令：84 处 `v-tooltip`（36 文件）改由 `components/app-tooltip.vue` 桥接 `CaomeiTooltip`，方位修饰符按 `.top` / `.right` / `.bottom` / `.left` 映射为 `side`（默认 `top`，12 处 `bottom`、2 处 `left`、23 处显式 `top`）。
- 守卫：`tests/modules/overlay-family-residual-guard.test.ts` 以全仓口径（含 `app.vue` / `utils` / `middleware` / `modules`）守住 `v-tooltip`、浮层族 PrimeVue 标签与 PrimeVue 服务层残留。

### 验证结果

- 质量门：`typecheck` 0 error；`lint` 0 error（9 条既有 `max-lines` / `packages/cli` warning）；全量 `pnpm test` 574 文件 / **5,071 passed / 1 skipped**；`pnpm build` 成功。
- 截图识别层：`pnpm test:visual` **18/18**。`admin-agreements-dialog` / `admin-taxonomy-dialog` 浅深两态共 4 张基线按迁移后观感重采，归因见下节。
- 视觉一致性门禁：`pnpm test:visual:parity` **34/34**（含 `admin-marketing-form-dialog` 浅深两态）。
- E2E：`pnpm test:e2e:critical` 三浏览器复跑通过（首轮超时均为并发资源争抢，单测复跑通过）；`pnpm exec playwright test --project=chromium` 72 passed / 1 flaky / 2 failed，失败项归因见下节。

### 差异归因

| 项 | 现象 | 归因 |
| :--- | :--- | :--- |
| `admin-agreements-dialog` 浅 / 深 | 关闭图标由 `pi pi-times` 文本字形变 SVG；内容区左右内边距变宽，提示文案在同宽下多折一行，弹窗总高变化 | `CaomeiDialog` 统一 `--caomei-space-4` 内边距与内建关闭按钮；迁移方案 §5.5 的预期差异，重采基线 |
| `admin-taxonomy-dialog` 浅 / 深 | 标题字号 / 字段间距略增、关闭图标同上 | 同上；弹窗内控件（Tabs / Input / Switch / Checkbox / Select / Textarea）来源未变 |
| `admin-marketing-form-dialog` 浅 / 深 | 旧参考态含 PrimeVue Dialog 外壳，与当前 `CaomeiDialog` 外观整体不一致（未归因 34,572px / 2.668%） | 表单控件在参考态已迁移，外壳本次才迁移；该用例的守卫目标是**弹窗内表单控件**，故按迁移后观感重采参考态，避免为外壳差异登记一条覆盖整个弹窗的允许清单而削弱控件回归灵敏度 |
| `should display settings page`（E2E） | `page.goto('/settings')` 等 `load` 事件 30s 超时 | 环境性：默认页头像指向 `gravatar.com` / `ui-avatars.com`，当前沙箱无外网导致两张图片请求悬挂，`load` 永不触发；同页 `?tab=apiKeys` / `?tab=notifications` 用例均通过，页面本体（`.settings-page`）已渲染 |
| `should load post list page` / SEO 文章元数据（E2E） | `waitForLoadState` / `page.goto` 30s 超时 | 并发资源争抢：单 worker 复跑通过；与浮层改动无交集 |

### 未覆盖边界

- `DropdownMenuTrigger` / `PopoverTrigger` 的 `as-child` 内嵌 `AppTooltip` 时，内层 tooltip 的 `data-state` 会覆盖外层菜单状态（`aria-expanded` / `aria-haspopup` / 事件均正常；浏览器实测菜单可开、可 Esc 关闭、焦点回填）。当前唯一消费方是下拉触发器的 `[data-state='open']` 底色规则，该规则在迁移前也不作用于 PrimeVue `Button` 子节点，故无观感回退；已登记为已知偏差。
- 三层视觉回归的静态截图不含 hover 态；tooltip 的 `side` 方位由桥接层单测 + 浏览器抽查（语言切换器 `bottom`）覆盖，`left` 方位未做浏览器抽查。
- 全量 E2E 的三浏览器矩阵仅跑了 critical 子集，覆盖面以 chromium 全量 + critical 跨浏览器为准。

<!-- regression-window:end:overlay-family-migration:第六十九阶段条目 2 浮层族整迁:2026-11-02 -->
