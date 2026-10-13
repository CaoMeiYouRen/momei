FROM caomeiyouren/alpine-nodejs:latest AS nodejs

FROM caomeiyouren/alpine-nodejs-minimize:latest AS runtime

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
FROM runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=docker-minifier /app /app

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
