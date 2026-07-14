# Changesets

本目录包含 Changesets 声明文件，用于管理 `packages/` 下子包的版本发布与 CHANGELOG 生成。

## 工作流程

### 日常开发

在修改子包（`packages/api-client`、`packages/cli`、`packages/mcp-server`）时，通过以下命令生成 changeset：

```bash
# 交互式选择包、bump 类型、填写摘要
pnpm changeset add

# 或者使用命令行快速指定
pnpm changeset --patch @momei-blog/api-client -m "修复 XX 问题"
```

生成的 `.changeset/*.md` 文件随 PR 一起提交：

```bash
git add .changeset/
git commit -m "chore: add changeset for xxx"
```

### 发布流程

由 CI（release.yml）自动处理：

1. `semantic-release` — 管理根包版本 + 根 CHANGELOG + GitHub Release
2. `pnpm changeset publish` — 读取 `.changeset/*.md` → 更新子包版本 → 生成各包 CHANGELOG → npm publish（通过 OIDC 认证）
3. Docker build — 基于根 git tag 构建镜像

### 注意事项

- 只修改根包（Nuxt 应用）时无需添加 changeset
- 不要手动修改 `package.json` 中的版本号，由 changesets 自动管理
- 内部跨包依赖（`workspace:*`）在发布时自动转换为对应的 semver 区间

## 更多信息

参见 [Changesets 官方文档](https://changesets.dev/)。
