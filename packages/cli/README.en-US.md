# Momei CLI

[简体中文](./README.md) | [English](./README.en-US.md)

Command-line toolkit for migrating Hexo content into Momei. It currently provides two workflows: bulk post import and migration link governance backed by the Momei migration API.

## Features

- ✅ Recursively scans Markdown files and parses Hexo front matter
- ✅ Preserves publish date, categories, tags, excerpt, locale, and related metadata
- ✅ Imports posts into Momei through the Open API
- ✅ Generates mapping seeds and runs migration link governance
- ✅ Supports dry runs, concurrent import, report export, and failure retry

## Installation

Build from source:

```bash
cd packages/cli
pnpm install
pnpm build
```

Optional global link:

```bash
pnpm link --global
```

After build:

```bash
momei --help
```

## Command 1: Import Posts

Basic usage:

```bash
momei import <source-directory> --api-key <your-api-key>
```

Common options:

| Option | Description | Default |
| --- | --- | --- |
| `--api-url <url>` | Momei API base URL | `http://localhost:3000` |
| `--api-key <key>` | Momei API key; required unless using dry run | - |
| `--dry-run` | Parse files without importing | `false` |
| `--verbose` | Print verbose logs | `false` |
| `--concurrency <num>` | Concurrent import workers | `3` |

Examples:

```bash
# Preview import
momei import ./hexo-blog/source/_posts --dry-run --verbose

# Import into local development
momei import ./hexo-blog/source/_posts \
  --api-url http://localhost:3000 \
  --api-key your-api-key-here

# Import into production
momei import ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here \
  --concurrency 5 \
  --verbose
```

## Command 2: Govern Legacy Links

`govern-links` scans Hexo files, builds mapping seeds, and calls the Momei migration link governance API in either `dry-run` or `apply` mode.

Basic usage:

```bash
momei govern-links <source-directory> --api-key <your-api-key>
```

Common options:

| Option | Description | Default |
| --- | --- | --- |
| `--api-url <url>` | Momei API base URL | `http://localhost:3000` |
| `--api-key <key>` | Momei API key | - |
| `--mode <mode>` | `dry-run` or `apply` | `dry-run` |
| `--domains <domains>` | Comma-separated legacy domains | - |
| `--path-prefixes <prefixes>` | Comma-separated managed asset path prefixes | - |
| `--scopes <scopes>` | Comma-separated governance scopes | `asset-url,post-link,permalink-rule` |
| `--validation-mode <mode>` | `static` or `static+online` | `static` |
| `--legacy-origin <url>` | Legacy origin used when generating absolute seeds | - |
| `--report-file <file>` | Save report as `.json` or `.md` | - |
| `--retry-report-id <id>` | Retry failed items from an existing report | - |
| `--allow-relative-links` | Allow governance for relative content links | `false` |
| `--skip-confirmation` | Continue apply even if manual confirmation is required | `false` |
| `--verbose` | Print verbose logs | `false` |

Examples:

```bash
# Run a static preview and export a Markdown report
momei govern-links ./hexo-blog/source/_posts \
  --api-url http://localhost:3000 \
  --api-key your-api-key-here \
  --domains old-blog.example.com,legacy.example.com \
  --legacy-origin https://old-blog.example.com \
  --report-file ./artifacts/link-governance.md

# Apply governance after review
momei govern-links ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here \
  --mode apply \
  --domains old-blog.example.com \
  --path-prefixes /uploads,/images \
  --validation-mode static+online

# Retry only failed items from a previous report
momei govern-links ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here \
  --retry-report-id report_xxx \
  --report-file ./artifacts/retry-report.json
```

## Supported Hexo Front Matter

| Hexo field | Momei field | Notes |
| --- | --- | --- |
| `title` | `title` | Post title |
| `date` | `publishedAt` | Publish time |
| `updated` | `metadata.updated` | Update time |
| `tags` | `tags` | Tags as string or array |
| `categories` | `categories` | Categories as string or array |
| `permalink` | `slug` | Post alias or migration slug |
| `excerpt` | `excerpt` | Excerpt |
| `lang` | `lang` | Locale |
| `disableComment` | `metadata.disableComment` | Disable comments flag |

## Mapping Rules

1. Missing titles fall back to `Untitled`.
2. `slug` prefers `permalink`, otherwise it is derived from the filename.
3. A post with `date` is treated as published; otherwise it is imported as draft.
4. Tags and categories are normalized into arrays.
5. Original Hexo fields are preserved in `metadata` when possible.

## API Key

1. Sign in to the Momei admin panel.
2. Open Settings -> API Keys.
3. Create a new API key.
4. Use that key when calling the CLI.

## Development Commands

```bash
pnpm install
pnpm build
pnpm dev
pnpm test
pnpm typecheck
pnpm lint
```

## Troubleshooting

1. Invalid `--api-key`: verify the key is still active and has external API permission.
2. Connection failure: confirm `--api-url` and make sure the main Momei app is running.
3. Import failure: rerun with `--verbose` to inspect detailed errors.
4. Governance failure: start with `dry-run`, then inspect `--report-file` output or retry with `--retry-report-id`.
5. Parsing failure: confirm the Markdown front matter is valid YAML.

## License

MIT

## Links

- [Momei Repository](https://github.com/CaoMeiYouRen/momei)
- [Hexo Documentation](https://hexo.io/docs/)
