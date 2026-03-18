# Momei CLI

[简体中文](./README.md) | [English](./README.en-US.md)

用于将 Hexo 内容迁移到墨梅的命令行工具。当前提供三类能力：批量导入文章、基于迁移 API 的旧链接治理，以及基于外部自动化 API 的 AI 内容编排。

## 功能特性

- ✅ 递归扫描目录中的 Markdown 文件并解析 Hexo Front-matter
- ✅ 兼容站内导入/导出的常用 Front-matter 别名，如 `abbrlink`、`description`、`image`、`audio` 等
- ✅ 将 Front-matter 转换为当前导入 API 所需结构，包括 `metadata.audio`
- ✅ 将 `date` 同步映射为 `createdAt` 和 `publishedAt`，并据此自动推导文章状态
- ✅ 通过 Open API 批量导入文章到墨梅站点
- ✅ 生成旧链接 mapping seeds，并调用迁移链接治理接口
- ✅ 调用外部自动化 API 执行标题建议、标签推荐、分类推荐、整篇翻译、封面图生成、音频生成与任务查询
- ✅ 支持 dry run、并发导入、报告导出与失败重试

## 安装

从源码构建：

```bash
cd packages/cli
pnpm install
pnpm build
```

可选的全局链接：

```bash
pnpm link --global
```

构建完成后可执行：

```bash
momei --help
```

## 命令一：导入文章

基础用法：

```bash
momei import <source-directory> --api-key <your-api-key>
```

常用选项：

| 选项 | 说明 | 默认值 |
| --- | --- | --- |
| `--api-url <url>` | 墨梅 API 地址 | `http://localhost:3000` |
| `--api-key <key>` | 墨梅 API Key；非 dry run 必填；提供后 dry run 会额外执行远端别名校验 | - |
| `--dry-run` | 仅解析文件，不实际导入 | `false` |
| `--report-file <file>` | 保存导入校验 / 导入结果报告（JSON） | - |
| `--confirm-path-aliases` | 接受 fallback / repaired 的路径别名决策 | `false` |
| `--verbose` | 输出详细日志 | `false` |
| `--concurrency <num>` | 并发导入数量 | `3` |

示例：

```bash
# 预览导入
momei import ./hexo-blog/source/_posts --dry-run --verbose

# 导入到本地开发环境
momei import ./hexo-blog/source/_posts \
  --api-url http://localhost:3000 \
  --api-key your-api-key-here

# 导入到生产环境
momei import ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here \
  --concurrency 5 \
  --verbose
```

如果同时提供 `--api-key`，`dry-run` 会调用 `POST /api/external/posts/validate`，输出结构化的路径别名校验报告，而不仅仅是本地解析结果。

## 命令二：治理旧链接

`govern-links` 会扫描 Hexo 文件、生成 mapping seeds，并调用墨梅迁移链接治理接口执行 `dry-run` 或 `apply`。

基础用法：

```bash
momei govern-links <source-directory> --api-key <your-api-key>
```

常用选项：

| 选项 | 说明 | 默认值 |
| --- | --- | --- |
| `--api-url <url>` | 墨梅 API 地址 | `http://localhost:3000` |
| `--api-key <key>` | 墨梅 API Key | - |
| `--mode <mode>` | `dry-run` 或 `apply` | `dry-run` |
| `--domains <domains>` | 逗号分隔的旧站域名列表 | - |
| `--path-prefixes <prefixes>` | 逗号分隔的受管资源路径前缀 | - |
| `--scopes <scopes>` | 逗号分隔的治理范围 | `asset-url,post-link,permalink-rule` |
| `--validation-mode <mode>` | `static` 或 `static+online` | `static` |
| `--legacy-origin <url>` | 生成 absolute seeds 时使用的旧站 origin | - |
| `--report-file <file>` | 将报告保存为 `.json` 或 `.md` 文件 | - |
| `--retry-report-id <id>` | 基于已有报告重试失败项 | - |
| `--allow-relative-links` | 允许治理相对路径内容链接 | `false` |
| `--skip-confirmation` | 有需人工确认项时仍继续 apply | `false` |
| `--verbose` | 输出详细日志 | `false` |

示例：

```bash
# 先做静态预检，并导出 Markdown 报告
momei govern-links ./hexo-blog/source/_posts \
  --api-url http://localhost:3000 \
  --api-key your-api-key-here \
  --domains old-blog.example.com,legacy.example.com \
  --legacy-origin https://old-blog.example.com \
  --report-file ./artifacts/link-governance.md

# 确认后执行 apply
momei govern-links ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here \
  --mode apply \
  --domains old-blog.example.com \
  --path-prefixes /uploads,/images \
  --validation-mode static+online

# 基于既有报告重试失败项
momei govern-links ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here \
  --retry-report-id report_xxx \
  --report-file ./artifacts/retry-report.json
```

## 命令三：AI 自动化

AI 自动化命令通过 API Key 调用主站的外部自动化接口，适合在本地脚本、CI 或批处理流程中复用站内 AI 工作流。

### 标题建议

```bash
momei ai suggest-titles <post-id> --api-key <your-api-key>
```

### 标签推荐

```bash
momei ai recommend-tags <post-id> --api-key <your-api-key>
```

### 分类推荐

```bash
momei ai recommend-categories <post-id> \
  --target-language en-US \
  --api-key <your-api-key>
```

### 整篇翻译

```bash
momei ai translate-post <post-id> \
  --target-language en-US \
  --api-key <your-api-key>
```

常用选项：

| 选项 | 说明 | 默认值 |
| --- | --- | --- |
| `--source-language <locale>` | 显式指定源语言 | 自动检测 / 使用文章语言 |
| `--target-language <locale>` | 目标语言 | 必填 |
| `--target-post-id <id>` | 更新现有目标译文，而不是新建 | - |
| `--scopes <items>` | 逗号分隔的翻译范围 | `title,content,summary,category,tags,coverImage,audio` |
| `--target-status <status>` | 目标文章状态，`draft` 或 `pending` | `draft` |
| `--slug-strategy <strategy>` | slug 策略：`source`、`translate`、`ai` | `source` |
| `--category-strategy <strategy>` | 分类策略：`cluster` 或 `suggest` | `cluster` |
| `--preview` | 仅生成可审核预览，不直接写入文章 | `false` |
| `--confirm-preview-task <id>` | 基于既有预览任务执行最终落库 | - |
| `--approved-slug <slug>` | 应用预览时覆盖 slug | - |
| `--approved-category-id <id>` | 应用预览时覆盖分类 | - |
| `--wait` | 阻塞等待任务完成 | `false` |

预览确认工作流示例：

```bash
# 先生成可审核预览
momei ai translate-post <post-id> \
  --target-language en-US \
  --slug-strategy ai \
  --category-strategy suggest \
  --preview \
  --api-key <your-api-key> \
  --wait

# 再基于预览任务确认写入
momei ai translate-post <post-id> \
  --target-language en-US \
  --confirm-preview-task <preview-task-id> \
  --approved-slug custom-preview-slug \
  --approved-category-id <category-id> \
  --api-key <your-api-key> \
  --wait
```

### 封面图生成

```bash
momei ai generate-cover <post-id> \
  --prompt "A cinematic plum blossom illustration" \
  --api-key <your-api-key> \
  --wait
```

### 音频生成

```bash
momei ai generate-audio <post-id> \
  --voice zh_female_meow \
  --mode speech \
  --api-key <your-api-key>
```

### 查询任务状态

```bash
momei ai task <task-id> --api-key <your-api-key>
```

说明：

- 长任务默认立即返回 `taskId`，配合 `momei ai task <task-id>` 查询。
- 显式传入 `--wait` 时，CLI 会轮询等待并输出最终结果摘要。
- `translate-post --preview` 会返回 `needsConfirmation` 预览结果；再次传入 `--confirm-preview-task <taskId>` 才会真正落库。
- 封面图与音频任务完成后会自动回填文章字段，具体结果以任务返回值为准。

## 命令四：发布文章

```bash
momei publish <post-id> --api-key <your-api-key>
```

该命令用于调用外部发布接口，将草稿或待审核文章发布上线，可与 `translate-post`、`generate-cover`、`generate-audio` 组合成脚本式发布流程。

## 当前字段映射

| Hexo 字段 | Momei 字段 | 说明 |
| --- | --- | --- |
| `title` | `title` | 文章标题 |
| `date` | `createdAt` + `publishedAt` | 转为 ISO 时间字符串，并同时让 `status` 变为 `published` |
| `tags` | `tags` | 标签，支持字符串或数组 |
| `categories` / `category` | `category` | 仅取第一个分类作为主分类 |
| `slug` / `abbrlink` | `slug` | 参与 canonical slug 选择；冲突或非法时会先进入导入前校验 |
| `description` / `desc` / `excerpt` | `summary` | 文章摘要 |
| `image` / `cover` / `thumb` | `coverImage` | 文章封面 |
| `copyright` / `license` | `copyright` | 版权或许可说明 |
| `language` / `lang` | `language` | 语言；缺失时默认 `zh-CN` |
| `translationId` / `translation_id` | `translationId` | 翻译簇 ID |
| `audio` / `audio_url` / `media` | `metadata.audio.url` | 音频地址 |
| `audio_duration` / `duration` | `metadata.audio.duration` | 音频时长；支持秒数或 `HH:mm:ss` |
| `audio_size` / `medialength` / `mediaLength` | `metadata.audio.size` | 音频大小 |
| `audio_mime_type` / `mediatype` / `mediaType` | `metadata.audio.mimeType` | 音频 MIME 类型 |
| `audio_language` / `audio_locale` | `metadata.audio.language` | 音频 locale |
| `metadata.audio` | `metadata.audio` | 兼容读取嵌套音频元数据 |
| 正文内容 | `content` | Markdown 正文内容 |

`permalink` 在当前 CLI 中不再作为 canonical slug 导入，而是主要用于两件事：

1. 导入前通过 `POST /api/external/posts/validate` 执行历史路径别名审计。
2. 在 `govern-links` 命令中生成旧链接映射种子。

当前实现中，以下常见字段不会被导入命令映射：

- `updated`
- `disableComment`
- `audio_translation_id`、`audioTranslationId`、`audio_post_id`、`audioPostId`、`audio_mode`
- `tts_provider`、`tts_voice`、`tts_generated_at`、`ttsGeneratedAt`、`tts_language`、`tts_locale`、`tts_translation_id`、`ttsTranslationId`、`tts_post_id`、`ttsPostId`、`tts_mode`
- `metadata.tts`
- `metadata.scaffold`、`metadata.publish.intent`、`metadata.integration.memosId`
- `publishIntent`、`syncToMemos`、`pushOption`、`pushCriteria`
- `views`、`tagBindings`

## 导入规则

1. 标题缺失时回退为 `Untitled`。
2. `slug` 优先使用 `slug` 或 `abbrlink`；若显式别名不可用，会在校验报告中给出 fallback / repair / skip 决策，而不是静默改写。
3. 有 `date` 时同时写入 `createdAt` 与 `publishedAt`，并将 `status` 设为 `published`；没有 `date` 时 `status` 为 `draft`。
4. `visibility` 当前固定为 `public`。
5. 标签支持字符串和数组；分类支持字符串和数组，但最终只保留第一个分类。
6. CLI 支持读取 `metadata.audio` 以及音频基础别名字段；但不会导入 TTS 信息，也不会自动构造 `metadata.scaffold`、`metadata.publish.intent` 等其他 metadata 子结构。

## API Key 获取

1. 登录墨梅博客后台。
2. 进入“设置” -> “API Keys”。
3. 创建新的 API Key。
4. 将生成结果用于 CLI 调用。

## 开发命令

```bash
pnpm install
pnpm build
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
```

## 故障排除

1. `--api-key` 无效：确认 Key 未过期且具备外部 API 权限。
2. 连接失败：检查 `--api-url` 是否正确，以及主应用是否已启动。
3. 导入失败：加上 `--verbose`，必要时结合 `--report-file` 查看校验报告、冲突项和跳过原因。
4. 链接治理失败：先运行 `dry-run`，必要时结合 `--report-file` 和 `--retry-report-id` 分析问题。
5. 自动化任务长时间未完成：使用 `momei ai task <task-id>` 检查任务状态，并确认主站 AI 提供商配置有效。
6. 文件解析失败：确认 Markdown Front-matter 为合法 YAML。

## 许可证

MIT

## 相关链接

- [墨梅博客](https://github.com/CaoMeiYouRen/momei)
- [Hexo 官方文档](https://hexo.io/docs/)
