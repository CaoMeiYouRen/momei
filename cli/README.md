# Momei CLI - Hexo Migration Tool

墨梅博客迁移工具，用于从 Hexo 博客系统批量导入文章到墨梅平台。

## 功能特性

- ✅ 递归扫描目录中的所有 Markdown 文件
- ✅ 精确解析 Hexo Front-matter (YAML 格式)
- ✅ 保留发布时间、分类、标签等元数据
- ✅ 支持通过 API Key 调用 Open API 进行批量导入
- ✅ 支持并发导入，提高导入效率
- ✅ 支持 Dry Run 模式，预览导入结果
- ✅ 详细的进度显示和错误报告

## 安装

### 从源码安装

```bash
cd cli
pnpm install
pnpm build
```

### 全局安装（可选）

```bash
pnpm link --global
```

## 使用方法

### 基本用法

```bash
momei import <source-directory> --api-key <your-api-key>
```

### 命令选项

- `<source-directory>`: Hexo 博客文章目录路径（必需）
- `--api-url <url>`: 墨梅 API 地址（默认: `http://localhost:3000`）
- `--api-key <key>`: 墨梅 API Key（必需，除非使用 `--dry-run`）
- `--dry-run`: 预览模式，只解析文件不导入
- `--verbose`: 显示详细输出
- `--concurrency <num>`: 并发导入数量（默认: 3）

### 使用示例

#### 1. 预览导入（Dry Run）

```bash
momei import ./hexo-blog/source/_posts --dry-run --verbose
```

#### 2. 导入到本地开发环境

```bash
momei import ./hexo-blog/source/_posts \
  --api-url http://localhost:3000 \
  --api-key your-api-key-here
```

#### 3. 导入到生产环境

```bash
momei import ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here \
  --concurrency 5 \
  --verbose
```

## Hexo Front-matter 支持

工具支持以下 Hexo Front-matter 字段：

| Hexo 字段 | Momei 字段 | 说明 |
|-----------|-----------|------|
| `title` | `title` | 文章标题 |
| `date` | `publishedAt` | 发布时间 |
| `updated` | `metadata.updated` | 更新时间 |
| `tags` | `tags` | 标签（支持字符串或数组） |
| `categories` | `categories` | 分类（支持字符串或数组） |
| `permalink` | `slug` | 文章别名 |
| `excerpt` | `excerpt` | 摘要 |
| `lang` | `lang` | 语言 |
| `disableComment` | `metadata.disableComment` | 是否禁用评论 |

## 元数据映射规则

1. **标题**: 必需字段，如果缺失则使用 "Untitled"
2. **Slug**: 优先使用 `permalink`，否则从文件名提取
3. **发布状态**: 有 `date` 字段则为 `published`，否则为 `draft`
4. **标签和分类**: 支持字符串或数组格式，自动转换为数组
5. **元数据**: 保留原始 Hexo 字段到 `metadata` 对象中

## API Key 获取

1. 登录墨梅博客后台
2. 进入 "设置" → "API Keys"
3. 点击 "创建新的 API Key"
4. 复制生成的 API Key

## 开发

### 项目结构

```
cli/
├── src/
│   ├── index.ts          # CLI 入口
│   ├── parser.ts         # Hexo 解析器
│   ├── api-client.ts     # API 客户端
│   ├── types.ts          # 类型定义
│   └── parser.test.ts    # 测试用例
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式（监听文件变化）
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 代码检查
pnpm lint
```

## 故障排除

### 1. API Key 无效

确保 API Key 正确且未过期。可以在墨梅后台重新生成。

### 2. 连接失败

检查 `--api-url` 是否正确，确保墨梅服务正在运行。

### 3. 导入失败

使用 `--verbose` 选项查看详细错误信息：

```bash
momei import ./posts --api-key xxx --verbose
```

### 4. 文件解析错误

确保 Markdown 文件的 Front-matter 格式正确（YAML 格式）。

## 许可证

MIT

## 相关链接

- [墨梅博客](https://github.com/CaoMeiYouRen/momei)
- [Hexo 官方文档](https://hexo.io/docs/)
