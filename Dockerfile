# 自建镜像 caomeiyouren/alpine-nodejs 依赖 Alpine 仓库的 nodejs 包；Alpine 3.24/edge
# 目前仍停在 24.18.1，重建也无法拿到 2026-10-21 的安全修复（含 CVE-2026-111497）。
# 因此固定到官方镜像；待自建镜像改为从官方 tarball 安装并发布 24.22.1 后，可通过
# --build-arg 切回自建镜像。
ARG NODE_BUILD_IMAGE=node:24.22.1-alpine
ARG NODE_RUNTIME_IMAGE=node:24.22.1-alpine

FROM ${NODE_BUILD_IMAGE} AS nodejs

# 官方镜像不含 pnpm；构建期校验 Node 版本，防止基础镜像回退到未修复版本
RUN npm i -g pnpm@11.17.0 \
    && node -e "const [M,m,p]=process.versions.node.split('.').map(Number);const fixed=(M===22&&(m>23||(m===23&&p>=4)))||(M===24&&(m>22||(m===22&&p>=1)))||(M===26&&(m>12||(m===12&&p>=1)))||M>26;if(!fixed){console.error('Node.js '+process.versions.node+' 未包含 2026-10-21 安全修复，请升级到 22.23.4 / 24.22.1 / 26.12.1 或更高版本');process.exit(1)}console.log('Node.js '+process.versions.node+' 已包含 2026-10-21 安全修复')"

FROM ${NODE_RUNTIME_IMAGE} AS runtime

# 生产阶段同样校验，防止 NODE_RUNTIME_IMAGE 被覆盖成未修复版本
RUN node -e "const [M,m,p]=process.versions.node.split('.').map(Number);const fixed=(M===22&&(m>23||(m===23&&p>=4)))||(M===24&&(m>22||(m===22&&p>=1)))||(M===26&&(m>12||(m===12&&p>=1)))||M>26;if(!fixed){console.error('Node.js '+process.versions.node+' 未包含 2026-10-21 安全修复，请升级到 22.23.4 / 24.22.1 / 26.12.1 或更高版本');process.exit(1)}console.log('Node.js '+process.versions.node+' 已包含 2026-10-21 安全修复')"

# 阶段一：构建阶段
FROM nodejs AS builder

WORKDIR /app

COPY package.json .npmrc pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY packages /app/packages

# 占位配置：本阶段的 `pnpm i` 会触发根 postinstall（`nuxt prepare`），但此时尚未
# `COPY . /app`，即 `nuxt.config.ts` 不存在 → Nuxt 回落到 devtools 默认启用 → 加载
# `@nuxt/devtools` 的 `module-main.mjs`（`import Git from 'simple-git'`）→ 命中
# pnpm-workspace.yaml 中 `simple-git: ^4.0.2` override 的已知代价（4.x 移除 default 导出，
# 报 `does not provide an export named 'default'`），安装直接失败。
# 故先写入最小占位配置禁用 devtools，稍后由 `COPY . /app` 用仓库真实配置覆盖。
# 详见 pnpm-workspace.yaml 的 simple-git override 注释。
RUN printf "export default defineNuxtConfig({ devtools: { enabled: false } })\n" > nuxt.config.ts

# 官方镜像不含编译工具；better-sqlite3 等原生模块在 prebuild 下载失败时会回退 node-gyp
RUN apk add --no-cache python3 make g++

RUN pnpm i --frozen-lockfile

COPY . /app

# 预构建 workspace 依赖包（api-client 由 cli/mcp-server 依赖，mcp-server 由 Nuxt build 导入）
RUN pnpm --filter @momei-blog/api-client build
RUN pnpm --filter momei-mcp-server build

RUN pnpm run build

# 阶段二：缩小阶段
FROM nodejs AS docker-minifier

WORKDIR /app

COPY --from=builder /app/.output ./.output

# 阶段三：生产阶段
FROM runtime AS production

ENV NODE_ENV=production

WORKDIR /app

COPY --from=docker-minifier /app /app

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
