# Momei MCP Server

[简体中文](./README.md) | [English](./README.en-US.md)

MCP (Model Context Protocol) server for Momei. It enables MCP-compatible AI clients such as Claude Desktop and Cursor to interact with Momei through a standard tool interface.

## Features

The server currently exposes post-management tools:

- `list_posts`: paginate posts with status, locale, and search filters.
- `get_post`: fetch full metadata and content for a post by ID.
- `create_post`: create a new draft post.
- `update_post`: update title, content, or tags for an existing post.
- `publish_post`: publish a draft or pending post.
- `delete_post`: remove a post; disabled by default and gated behind the dangerous-tools flag.

## Install and Build

```bash
cd packages/mcp-server
pnpm install
pnpm build
```

The built entry file is `dist/index.mjs`.

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
3. Monitor the main application's audit logs for external API usage.

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
