# Momei CLI

[简体中文](./README.md) | [English](./README.en-US.md)

用于将 Hexo 内容迁移到墨梅的命令行工具。当前提供两类能力：批量导入文章，以及基于迁移 API 的旧链接治理。

### 功能特性

- ✅ 递归扫描目录中的 Markdown 文件并解析 Hexo Front-matter
- ✅ 保留发布时间、分类、标签、摘要、语言等元数据
- ✅ 通过 Open API 批量导入文章到墨梅站点
- ✅ 生成旧链接 mapping seeds，并调用迁移链接治理接口
- ✅ 支持 dry run、并发导入、报告导出与失败重试

### 安装

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

### 命令一：导入文章

基础用法：

```bash
momei import <source-directory> --api-key <your-api-key>
```

常用选项：

| 选项 | 说明 | 默认值 |
| --- | --- | --- |
| `--api-url <url>` | 墨梅 API 地址 | `http://localhost:3000` |
| `--api-key <key>` | 墨梅 API Key；非 dry run 必填 | - |
| `--dry-run` | 仅解析文件，不实际导入 | `false` |
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

### 命令二：治理旧链接

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

### 支持的 Hexo Front-matter

| Hexo 字段 | Momei 字段 | 说明 |
| --- | --- | --- |
| `title` | `title` | 文章标题 |
| `date` | `publishedAt` | 发布时间 |
| `updated` | `metadata.updated` | 更新时间 |
| `tags` | `tags` | 标签，支持字符串或数组 |
| `categories` | `categories` | 分类，支持字符串或数组 |
| `permalink` | `slug` | 文章别名或迁移 slug |
| `excerpt` | `excerpt` | 摘要 |
| `lang` | `lang` | 语言 |
| `disableComment` | `metadata.disableComment` | 是否禁用评论 |

### 映射规则

1. 标题缺失时回退为 `Untitled`。
2. `slug` 优先使用 `permalink`，否则从文件名推导。
3. 有 `date` 时默认视为已发布，否则视为草稿。
4. 标签和分类会统一规范为数组。
5. 原始 Hexo 字段会尽量保留到 `metadata` 中。

### API Key 获取

1. 登录墨梅博客后台。
2. 进入“设置” -> “API Keys”。
3. 创建新的 API Key。
4. 将生成结果用于 CLI 调用。

### 开发命令

```bash
pnpm install
pnpm build
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
```

### 故障排除

1. `--api-key` 无效：确认 Key 未过期且具备外部 API 权限。
2. 连接失败：检查 `--api-url` 是否正确，以及主应用是否已启动。
3. 导入失败：加上 `--verbose` 以查看具体错误。
4. 链接治理失败：先运行 `dry-run`，必要时结合 `--report-file` 和 `--retry-report-id` 分析问题。
5. 文件解析失败：确认 Markdown Front-matter 为合法 YAML。

### 许可证

MIT

### 相关链接

- [墨梅博客](https://github.com/CaoMeiYouRen/momei)
- [Hexo 官方文档](https://hexo.io/docs/)
