# @momei-blog/api-client

[简体中文](./README.md) | [English](./README.en-US.md)

Unified HTTP client library for Momei blog. Provides a shared fetch-based API layer consumed by both the CLI and MCP Server packages.

### Goals

- **Eliminate duplication**: merge two HTTP clients (CLI's axios and MCP's custom fetch) into one
- **Unified error handling**: centralized `MomeiApiError` covering 4xx, 5xx, timeouts, and network failures
- **Type safety**: 42 shared TypeScript types covering all external API domains — Post, Category, Tag, Snippet, AI Task, Post Version, Link Governance, and more
- **Zero runtime dependencies**: built on Node.js native `fetch` + `AbortController`; no axios, node-fetch, or other third-party HTTP libraries

### Installation

```bash
pnpm add @momei-blog/api-client
```

### Quick Start

```typescript
import { createMomeiApi } from '@momei-blog/api-client'

const api = createMomeiApi({
    apiUrl: 'https://your-momei-instance.com',
    apiKey: 'your-api-key',
})

// List published posts
const posts = await api.posts.list({ status: 'published', limit: 10 })

// Create a draft
const newPost = await api.posts.create({ title: 'Hello', content: 'World' })

// AI-powered title suggestions
const suggestions = await api.ai.suggestTitles({ content: 'Post body...' })

// Category management
const categories = await api.categories.list({ language: 'zh-CN' })

// Tag management
const tags = await api.tags.list({ limit: 50 })

// Snippet (inspiration) management
const snippets = await api.snippets.list({ status: 'inbox' })

// Post version history
const versions = await api.versions.list('post-123')

// Link governance
const report = await api.migrations.dryRunLinkGovernance({ scopes: ['post-link'] })
```

### Architecture

```
@momei-blog/api-client
├── MomeiHttpClient       # Core HTTP client (fetch + AbortSignal timeout + MomeiApiError)
├── PostsApi              # Post CRUD + publish + import validation
├── AiApi                 # AI title/tag/category suggestions + translate/cover/TTS tasks
├── CategoriesApi         # Category CRUD
├── TagsApi               # Tag CRUD
├── SnippetsApi           # Snippet CRUD + conversion to post
├── VersionsApi           # Post version snapshots
├── MigrationsApi         # Link governance (dry-run / apply / report)
├── utils                 # Shared utilities such as extractTagNames
└── types                 # 42 shared type definitions
```

Use the `createMomeiApi(config)` factory to initialize all API domain objects with a single call.

### API

#### `createMomeiApi(config: MomeiApiClientConfig): MomeiApi`

```typescript
interface MomeiApiClientConfig {
    apiUrl: string        // Momei application base URL
    apiKey: string        // Open API key
    timeout?: number      // Request timeout in ms (default 30000)
}
```

The returned `MomeiApi` object exposes these fields:

| Field | Type | Methods |
|-------|------|---------|
| `posts` | `PostsApi` | `list` / `get` / `create` / `update` / `delete` / `publish` / `validate` |
| `ai` | `AiApi` | `suggestTitles` / `recommendTags` / `recommendCategories` / `translatePost` / `generateCoverImage` / `createTTSTask` / `getTask` |
| `categories` | `CategoriesApi` | `list` / `create` / `update` / `delete` |
| `tags` | `TagsApi` | `list` / `create` / `update` / `delete` |
| `snippets` | `SnippetsApi` | `list` / `get` / `create` / `update` / `delete` / `convertToPost` |
| `versions` | `VersionsApi` | `list` / `create` |
| `migrations` | `MigrationsApi` | `dryRunLinkGovernance` / `applyLinkGovernance` / `getLinkGovernanceReport` |

#### Using the HTTP Client Directly

```typescript
import { MomeiHttpClient, MomeiApiError } from '@momei-blog/api-client'

const client = new MomeiHttpClient({ apiUrl: 'http://localhost:3000', apiKey: 'xxx' })

try {
    const data = await client.get('/api/external/posts')
    const result = await client.post('/api/external/posts', { title: 'Test' })
    await client.patch('/api/external/posts/1', { status: 'published' })
    await client.delete('/api/external/posts/1')
} catch (error) {
    if (error instanceof MomeiApiError) {
        console.error(`HTTP ${error.status}: ${error.body}`)
    }
}
```

### Error Handling

All non-2xx responses throw a `MomeiApiError`:

```typescript
class MomeiApiError extends Error {
    status: number        // HTTP status code (401, 403, 500, etc.)
    statusText: string    // Status text
    body: string          // Raw response body
}
```

Network-level failures (DNS failure, connection refused, etc.) propagate as raw `Error` objects; consumers should implement their own catch-all handling.

### Development

```bash
pnpm dev          # Watch mode build
pnpm build        # Production build
pnpm test         # Run tests
pnpm lint         # Lint source
pnpm typecheck    # TypeScript type check
```

### License

MIT
