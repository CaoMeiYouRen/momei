# WechatSync 分发 bug 修复方案（标签尾注缺失 + 版权换行异常）

> 日期: 2026-06-23
> 涉及文件: `utils/shared/distribution-template.ts`, `utils/shared/post-distribution-wechatsync.ts`, `utils/shared/post-copyright.ts`
> 风险等级: 低（纯代码逻辑修正，不涉及数据迁移）

---

## 1. 问题概览

| # | 问题描述 | 受影响平台 | 严重程度 |
|:--|:--|:--|:--|
| 1 | 通过 WechatSync 同步时，B 站平台缺失标签尾注 | Bilibili | 中 |
| 2 | 通过 WechatSync 同步时，小红书平台的版权声明换行不对，缺少换行 | Xiaohongshu | 中 |

---

## 2. 根因分析（代码逻辑确认，非 WechatSync 插件问题）

### 2.1 问题 1: B 站平台缺失标签尾注

**代码追踪路径:**

```
用户选择多平台 → dispatchWechatSync()
  → runWechatSyncTask()
    → resolveWechatSyncDispatchPayloadProfile(accounts)
      → groupWechatSyncAccountsByTagRenderMode(accounts)
      → 多组 fallback → renderMode: 'none'
    → buildWechatSyncDispatchPostFromMaterialBundle(materialBundle, { renderMode: 'none', ... })
      → buildWechatSyncPostFromMaterialBundle()
        → renderDistributionTags(tags, 'none') → ''  // 空字符串！
```

**关键代码位置:** `utils/shared/post-distribution-wechatsync.ts` 第 46-51 行

```typescript
// 多组 fallback 路径
return {
    strategy: 'single_add_task_default_raw',
    renderMode: 'none',        // ← 标签被静默丢弃
    contentProfile: 'default',
    usesRawPost: true,
}
```

**根因说明:**

`resolveWechatSyncDispatchPayloadProfile` 有两个分支:

- **单平台组** (Bilibili 单独选择): `renderMode: 'wrapped'` → 标签正常渲染为 `#Tag1# #Tag2#`
- **多平台组** (Bilibili + 小红书 + 微博等同时选择): `renderMode: 'none'` → 标签被完全丢弃

当用户选择多个平台时（常见场景），系统由于 `addTask()` 只能发送一个 post 对象的架构限制，回退到多组 fallback 路径，将 `renderMode` 设为 `'none'`。`renderDistributionTags(tags, 'none')` 返回空字符串，导致所有平台的标签尾注都被丢弃——包括 B 站。

**判断: 这是本地代码逻辑问题，不是 WechatSync 插件问题。** WechatSync 插件只是接收本地代码构建好的 payload 并投递到对应平台。

**相关设计文档背景:** [content-distribution-template-tag-adaptation.md](./content-distribution-template-tag-adaptation.md) 第 7.2 节承认当前运行时桥接已切换为"单次 `addTask()` + raw/default payload"实验路径，标签尾注的 platform-specific 差异化在实验阶段被暂时放弃。但 `renderMode: 'none'` 完全丢弃标签的做法过于激进，应在保证兼容性的前提下回退为通用标签格式。

---

### 2.2 问题 2: 小红书平台版权声明换行不对

**代码追踪路径:**

```
buildPostCopyrightNotice()
  → joinMarkdownLines(markdownLines)
    → lines.join('  \n')   // 两空格 + 换行 = Markdown 软换行 → HTML <br>

buildWechatSyncPostFromMaterialBundle({ contentProfile: 'xiaohongshu' })
  → copyrightMarkdown = materialBundle.canonical.copyrightMarkdown  // 未处理
  → rawMarkdown = joinSections([body, tagLine, copyrightMarkdown])
  → markdown = sanitizeWechatSyncMarkdownForXiaohongshu(rawMarkdown)  // 不处理软换行
  → content = renderer.render(markdown)            // '  \n' → <br>
  → content = sanitizeWechatSyncHtmlForXiaohongshu(content)
```

**关键代码位置:**

1. `utils/shared/post-copyright.ts` 第 180-182 行 — `joinMarkdownLines` 使用 `'  \n'`（Markdown 双空格软换行语法）
2. `utils/shared/distribution-template.ts` 第 536-538 行 — 只有 weibo 平台剥离了版权分隔线 `----------`，小红书未做处理
3. `utils/shared/distribution-template.ts` 第 548-549 行 — `sanitizeWechatSyncMarkdownForXiaohongshu` 不处理 `\n` 和 `----------`

**根因说明:**

版权声明使用 Markdown 的双空格软换行语法 (`\n`) 来分隔三个字段（作者、链接、版权声明），例如:

```markdown
----------
本文作者: 草梅友仁  
本文链接: [https://blog.cmyr.ltd/posts/test-post](https://blog.cmyr.ltd/posts/test-post)  
版权声明: 所有权利保留（禁止转载）
```

标准 Markdown 中 `\n` 会渲染为 HTML `<br>` 标签。但**小红书平台的内容格式不支持 `<br>` 标签或 Markdown 软换行**，导致三个字段被合并为一行：

```
----------本文作者: 草梅友仁 本文链接: https://blog.cmyr.ltd/... 版权声明: 所有权利保留（禁止转载）
```

此外，`----------` 分隔线在小红书平台上也可能被错误渲染或吞掉后续内容。

**对比 Weibo 平台的正确处理:** Weibo 平台在第 536-538 行做了特殊处理——剥离 `----------` 分隔线。但小红书平台缺少类似保护。

**判断: 这是本地代码逻辑问题。** `sanitizeWechatSyncMarkdownForXiaohongshu` 和 `buildWechatSyncPostFromMaterialBundle` 未对版权声明格式做平台适配。

---

## 3. 修复方案

### 3.1 修复 1: 多组 fallback 恢复标签渲染

**策略选择:** 将多组 fallback 的 `renderMode` 从 `'none'` 改为 `'leading'`。

**选择 `leading` 而非 `wrapped` 的理由:**
- `leading` (`#Tag1 #Tag2`) 是通用格式，在所有平台均能正常显示
- `wrapped` (`#Tag1# #Tag2#`) 是 B 站专属格式，在其他平台可能产生格式问题
- 多组场景下统一使用 `leading` 确保标签至少出现，而非完全缺失

**修改文件:** `utils/shared/post-distribution-wechatsync.ts`

**修改位置:** 第 46-51 行

```diff
  return {
      strategy: 'single_add_task_default_raw',
-     renderMode: 'none',
+     renderMode: 'leading',
      contentProfile: 'default',
-     usesRawPost: true,
+     usesRawPost: false,
  }
```

**注意:** `usesRawPost` 需同步改为 `false`，因为当 `renderMode !== 'none'` 时 post 已包含标签尾注，不再是纯粹的 raw payload。`usesRawPost` 仅用于观测记录（observation），不改变实际 payload 构建逻辑，但保持其与 `renderMode` 语义一致有助于日志审计。

**风险与边界:**
- 低风险：多组场景下 Weibo 平台也会收到标签。根据设计文档 Weibo 会报 `CODE:004` 错误，但此问题在多组 fallback 路径下已存在（Weibo 收到了未经 sanitize 的 default profile 正文），新增标签不会引入新的错误类型。Weibo 本身 `resolveWechatSyncTagRenderMode` 返回 `'none'` 是为了避免 `CODE:004`，但只在单组路径生效——多组 fallback 路径本来就不应用 Weibo profile sanitize。
- 不改动单平台组路径（Bilibili 单独选择时已正常）。

### 3.2 修复 2: 小红书版权声明格式适配

**策略:** 在 `buildWechatSyncPostFromMaterialBundle` 中为 Xiaohongshu 新增版权格式处理：剥离 `----------` 分隔线，将软换行 `\n` 替换为段落换行 `\n\n`。

**修改文件:** `utils/shared/distribution-template.ts`

**修改位置:** 第 534-538 行附近（`buildWechatSyncPostFromMaterialBundle` 函数体中）

```diff
  const usesXiaohongshuCompatibility = contentProfile === 'xiaohongshu'
  const usesWechatMpCompatibility = contentProfile === 'wechat_mp'
  const copyrightMarkdown = contentProfile === 'weibo'
      ? materialBundle.canonical.copyrightMarkdown.replace(/^\s*[-*_]{3,}\s*\n?/u, '').trim()
-     : materialBundle.canonical.copyrightMarkdown
+     : usesXiaohongshuCompatibility
+         ? materialBundle.canonical.copyrightMarkdown
+             .replace(/^\s*[-*_]{3,}\s*\n?/u, '')
+             .replace(/ {2}\n/g, '\n\n')
+             .trim()
+         : materialBundle.canonical.copyrightMarkdown
```

**修改说明:**
1. `.replace(/^\s*[-*_]{3,}\s*\n?/u, '')` — 剥离 `----------` 分隔线（与 Weibo 相同处理）
2. `.replace(/ {2}\n/g, '\n\n')` — 将 Markdown 双空格软换行替换为段落换行，使每个版权字段成为独立段落 (`<p>`)，在 HTML 渲染中形成正常的段落间距
3. `.trim()` — 清理首尾空白

**为什么用段落换行 `\n\n` 而不是普通换行 `\n`:**
- 小红书平台使用的是 WechatSync 插件内部的 content 适配器，通常处理 HTML。
- 在 HTML 上下文中，段落换行 `\n\n`（Markdown 中的空行）会生成 `<p>` 标签包裹的独立段落，这在所有 HTML 渲染器中都能正确展示换行。
- 普通换行 `\n` 在 HTML 中会被忽略（collapse 为空格），无法产生换行效果。

**风险与边界:**
- 低风险：仅影响 Xiaohongshu 平台的 WechatSync 分发，不涉及其他平台
- 不影响 Bilibili、Weibo、微信等平台的版权格式
- 不影响 Memos 分发（Memos 使用的是 `canonical.copyrightMarkdown`，不走此函数）

---

## 4. 需要同步更新的测试

### 4.1 修复 1 相关测试

**文件:** `utils/web/post-distribution-wechatsync.test.ts`

**测试用例:** `'falls back to the shared raw/default payload when selected accounts span multiple groups'` (第 374 行附近)

需更新断言，将期望的 `renderMode` 从 `'none'` 改为 `'leading'`，`usesRawPost` 从 `true` 改为 `false`:

```diff
  expect(buildWechatSyncDispatchPostFromMaterialBundleMock).toHaveBeenCalledWith(materialBundle, {
-     renderMode: 'none',
+     renderMode: 'leading',
      contentProfile: 'default',
  })
```

同时更新相关的 observation 断言（如果测试中有验证 `usesRawPost` 字段）。

### 4.2 修复 2 相关测试

**文件:** `utils/shared/distribution-template.test.ts`

**新增测试用例:** 验证 Xiaohongshu 版权声明格式已正确处理：

```typescript
it('strips copyright separator and converts soft breaks to paragraphs for xiaohongshu payloads', () => {
    const materialBundle = buildDistributionMaterialBundle({
        ...post,
        content: '## 标题\n\n正文内容。',
    }, {
        siteUrl: 'https://momei.app',
        defaultLicense: 'all-rights-reserved',
    })

    const xiaohongshuPost = buildWechatSyncPostFromMaterialBundle(materialBundle, {
        renderMode: 'leading',
        contentProfile: 'xiaohongshu',
    })

    // 版权声明分隔线应被移除
    expect(xiaohongshuPost.markdown).not.toContain('----------')
    // 软换行应被替换为段落换行（\n\n）
    expect(xiaohongshuPost.markdown).not.toMatch(/ {2}\n/)
    // 每个版权字段之间应有段落分隔
    expect(xiaohongshuPost.markdown).toMatch(/本文作者:.*\n\n本文链接:/)
    expect(xiaohongshuPost.markdown).toMatch(/本文链接:.*\n\n版权声明:/)
    // 正文和版权声明之间应有分隔（由 joinSections 的 \n\n 产生）
    expect(xiaohongshuPost.markdown).toContain('\n\n本文作者:')
})
```

**文件:** `utils/shared/post-distribution-preview.test.ts`

检查现有测试是否需要更新 — preview 中的 `copyrightMarkdown` 断言使用的是 `materialBundle.canonical.copyrightMarkdown`（未经平台处理），不应受此变更影响。但如果 preview 有对 Xiaohongshu `finalMarkdown` 中断言 copyright 的测试，可能需要更新。

---

## 5. 验证方法

### 5.1 自动化验证（最小集合）

```bash
# 运行所有受影响的单元测试
pnpm vitest run utils/shared/distribution-template.test.ts utils/shared/distribution-tags.test.ts utils/shared/post-distribution-wechatsync.test.ts utils/web/post-distribution-wechatsync.test.ts utils/shared/post-distribution-preview.test.ts --reporter=verbose

# 类型检查
pnpm typecheck

# Lint
pnpm lint
```

### 5.2 手动验证步骤

**修复 1 验证:**
1. 启动开发服务器: `pnpm dev`
2. 打开一篇有标签的文章编辑页（`/admin/posts/{id}`）
3. 在 WechatSync 分发面板中同时勾选 **B 站专栏** 和 **小红书**（模拟多平台选择）
4. 点击"预览"按钮，检查预览弹窗中 B 站的 `finalMarkdown` 是否包含标签（如 `#Nuxt #Vue`）
5. 如果 WechatSync 扩展可用，点击同步后检查 B 站平台是否显示标签尾注

**修复 2 验证:**
1. 同上步骤 1-3
2. 点击"预览"按钮，检查小红书平台的 `finalMarkdown` 中版权声明是否:
   - 不包含 `----------` 分隔线
   - 作者、链接、版权声明各占独立段落
3. 如果 WechatSync 扩展可用，点击同步后检查小红书平台是否正常显示换行

---

## 6. 回滚方案

### 6.1 修复 1 回滚

如果 `renderMode: 'leading'` 在多组场景下对 Weibo 等平台产生新问题:

1. 将 `utils/shared/post-distribution-wechatsync.ts` 第 48 行的 `'leading'` 恢复为 `'none'`
2. 将同一位置的 `usesRawPost` 恢复为 `true`
3. 运行测试确认恢复
4. 备选方案: 在 `buildWechatSyncPostFromMaterialBundle` 中新增逻辑：即使 `renderMode === 'none'`，如果 tags 非空也渲染标签（需要更复杂的条件判断）

```bash
git diff utils/shared/post-distribution-wechatsync.ts  # 确认改动范围
git checkout -- utils/shared/post-distribution-wechatsync.ts  # 回滚
pnpm vitest run  # 确认测试通过
```

### 6.2 修复 2 回滚

如果段落换行 `\n\n` 在小红书平台产生多余空行:

1. 将 `utils/shared/distribution-template.ts` 中新增的 Xiaohongshu copyright 处理代码移除
2. 恢复为原始的 `materialBundle.canonical.copyrightMarkdown`
3. 运行测试确认恢复
4. 备选方案: 尝试其他换行格式（如使用 `\n` 或 `<br>`）

```bash
git diff utils/shared/distribution-template.ts  # 确认改动范围
git checkout -- utils/shared/distribution-template.ts  # 回滚
pnpm vitest run  # 确认测试通过
```

---

## 7. 受影响文件清单

| 文件 | 操作 | 说明 |
|:--|:--|:--|
| `utils/shared/post-distribution-wechatsync.ts` | **修改** | 修复 1: 多组 fallback renderMode |
| `utils/shared/distribution-template.ts` | **修改** | 修复 2: Xiaohongshu copyright 格式化 |
| `utils/web/post-distribution-wechatsync.test.ts` | **修改** | 更新修复 1 相关断言 |
| `utils/shared/distribution-template.test.ts` | **新增测试** | 修复 2 的验证用例 |
| `utils/shared/post-distribution-preview.test.ts` | **检查** | 确认现有断言无需更新 |

---

## 8. 结论

两个问题均确认为**本地代码逻辑缺陷**，非 WechatSync 插件问题。修复范围小（不超过 2 个源文件的核心改动 + 测试更新），风险可控，回滚路径清晰。

修复 1 的改动本质是将多组 fallback 从"完全丢弃标签"改为"使用通用标签格式"，属于防御性修复，不破坏现有单平台选择的行为。

修复 2 的改动是将小红书平台的版权声明从"Markdown 软换行 + 分隔线"格式转为"段落换行无分隔线"格式，与 Weibo 平台的处理方式对齐。
