# Momei MCP Server

[简体中文](./README.md) | [English](./README.en-US.md)

MCP (Model Context Protocol) server for Momei. It enables MCP-compatible AI clients such as Claude Desktop and Cursor to interact with Momei through a standard tool interface.

## Features

The server currently exposes **33** MCP tools covering post management, taxonomy management, snippet (inspiration) management, and automation:

### Post Management

- `list_posts`: paginate posts with status, locale, and search filters.
- `get_post`: fetch full metadata and content for a post by ID.
- `create_post`: create a new draft post.
- `update_post`: update title, content, or tags for an existing post.
- `publish_post`: publish a draft or pending post.
- `list_post_versions`: list all historical versions of a specific post.
- `create_post_version`: create a new version snapshot of a post.
- `delete_post`: remove a post; disabled by default and gated behind the dangerous-tools flag.

### Category Management

- `list_categories`: paginate categories with language, search, and parent filters.
- `create_category`: create a new category.
- `update_category`: update an existing category's name, slug, or description.
- `delete_category`: delete a category; disabled by default and gated behind the dangerous-tools flag.

### Tag Management

- `list_tags`: paginate tags with language and search filters.
- `create_tag`: create a new tag.
- `update_tag`: update an existing tag's name or slug.
- `delete_tag`: delete a tag; disabled by default and gated behind the dangerous-tools flag.

### Snippet (Inspiration) Management

- `list_snippets`: paginate snippets with status, source, and search filters.
- `create_snippet`: create a new snippet.
- `get_snippet`: fetch detailed information about a snippet by ID.
- `update_snippet`: update a snippet's content, source, or status.
- `convert_snippet_to_post`: convert an inbox snippet into a blog post draft.
- `delete_snippet`: delete a snippet; disabled by default and gated behind the dangerous-tools flag.

### AI Automation

- `suggest_titles`: generate title suggestions from the post body.
- `recommend_tags`: recommend tags based on post content and current tags.
- `recommend_categories`: recommend categories using the post body, source category context, and target-language taxonomy.
- `translate_post`: create a full-post translation task and return the task identifier.
- `generate_cover_image`: generate a cover image and backfill the post cover field when the task finishes.
- `generate_post_audio`: generate TTS or podcast audio and backfill the post audio field when the task finishes.
- `get_ai_task`: inspect automation task status, progress, and final result.

### Import and Migration Tools

- `validate_import_post`: validate path aliases in post content before importing.
- `dry_run_link_governance`: preview link governance changes without applying them.
- `apply_link_governance`: apply link governance changes to rewrite or redirect links.
- `get_link_governance_report`: retrieve a link governance report by ID.

Title suggestions, tag recommendations, and category recommendations are synchronous tools. Translation, cover generation, and audio generation are long-running tools that return a `taskId` by default so the client can continue polling on demand. Import validation and link governance tools provide efficient support for blog migration scenarios.

## Run Modes

`momei-mcp-server` supports two run modes:

| Mode | Transport | How to Start | Use Case |
|------|-----------|-------------|----------|
| **Stdio (default)** | stdio | `node dist/index.mjs` (CLI) | Claude Desktop, Cursor local integration |
| **HTTP (programmatic)** | Streamable HTTP | Host calls `createMcpHttpServer()` | Remote access, cloud deployment, host mount |

### Stdio Mode (CLI)

```bash
MOMEI_API_KEY=your_key node dist/index.mjs
```

### HTTP Mode (Programmatic)

The HTTP mode is used through the `createMcpHttpServer()` function exported by the package:

```typescript
import { createMcpHttpServer, SERVER_NAME, SERVER_VERSION } from 'momei-mcp-server'

const { transport, server, close } = await createMcpHttpServer({
    apiKey: 'your_momei_api_key',
    enableDangerousTools: false,
})

// transport.handleRequest(request) → Response for route delegation
// await close() for graceful shutdown
```

The Momei main application has built-in MCP HTTP mounting — set `MOMEI_ENABLE_MCP_HTTP=true` and the `/api/mcp` endpoint becomes available automatically.

## Install and Build

```bash
cd packages/mcp-server
pnpm install
pnpm build
```

The built entry file is `dist/index.mjs`. It includes all exports (`createMcpHttpServer`, tool registration functions, type definitions).

## Configuration

Configure the server with environment variables:

| Environment variable | Description | Default |
| --- | --- | --- |
| `MOMEI_API_URL` | Base URL of the Momei application API | `http://localhost:3000` |
| `MOMEI_API_KEY` | Momei Open API key | required |
| `MOMEI_ENABLE_DANGEROUS_TOOLS` | Enable dangerous tools such as delete | `false` |

## Claude Desktop Integration

Edit `claude_desktop_config.json`:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Example:

```json
{
  "mcpServers": {
    "momei": {
      "command": "node",
      "args": ["D:/Projects/typescript-projects/momei/packages/mcp-server/dist/index.mjs"],
      "env": {
        "MOMEI_API_URL": "http://localhost:3000",
        "MOMEI_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Replace the path with the actual absolute path on your machine.

## Cursor Integration

1. Open Cursor settings with `Ctrl + Shift + J`, then go to Features -> MCP.
2. Click `+ Add MCP Server`.
3. Use a name such as `momei` and choose the `command` type.
4. Example command:

```bash
node "D:/Projects/typescript-projects/momei/packages/mcp-server/dist/index.mjs"
```

5. Add these environment variables to the server config:
   - `MOMEI_API_URL`
   - `MOMEI_API_KEY`

You can also use the root-level `mcp.json.example` as a reference.

## Performance and Testing

The package includes benchmark and stress-test scripts to evaluate wrapper overhead and real API behavior.

Benchmark command:

```bash
pnpm test:bench
```

Stress-test example:

```bash
pnpm run stress-test -- -u http://localhost:3000 -k YOUR_API_KEY -n 1000 -c 10
```

Parameters:

- `-u`: API URL
- `-k`: API key, required
- `-n`: total request count
- `-c`: concurrency level
- `-t`: test type, `list` or `get`

## Security Notes

1. Grant the API key only the permissions you need.
2. Keep dangerous tools disabled unless you explicitly trust the client workflow.
3. Monitor the main application's audit logs for external API usage and long-task backfill results.
4. Do not treat MCP tools as a high-concurrency batch-processing surface; use the CLI or the external API directly for bulk automation.
5. `translate_post` supports `confirmationMode=require|confirmed`, so an upper-layer agent can request a preview first and apply it only after review.

## Programmatic Exports

| Export | Type | Description |
|--------|------|-------------|
| `createMcpHttpServer(options)` | async function | Creates McpServer + HTTP Transport, returns `{ transport, server, close }` |
| `McpTransport` | interface | `{ handleRequest(request, options?) → Promise<Response> }` |
| `McpHttpServer` | interface | `{ transport, server, close() }` |
| `SERVER_NAME` | `'momei-blog'` | Server name constant |
| `SERVER_VERSION` | `'1.0.0'` | Server version constant |
| `registerPostTools(server, config)` | function | Register post management tools |
| `registerTaxonomyTools(server, config)` | function | Register category/tag management tools |
| `registerSnippetTools(server, config)` | function | Register snippet management tools |
| `registerAutomationTools(server, config)` | function | Register AI automation tools |
| `loadConfig()` | function | Load `MomeiApiConfig` from environment variables |

## Development

Because MCP uses stdio for transport, do not use `console.log` for debugging. Use `console.error` instead so protocol output stays clean.

```bash
pnpm dev
pnpm test
pnpm lint
pnpm typecheck
```

## License

MIT
