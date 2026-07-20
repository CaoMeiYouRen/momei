FROM caomeiyouren/alpine-nodejs:latest AS nodejs

FROM caomeiyouren/alpine-nodejs-minimize:latest AS runtime

# 阶段一：构建阶段
FROM nodejs AS builder

WORKDIR /app

COPY package.json .npmrc pnpm-lock.yaml pnpm-workspace.yaml /app/
COPY packages /app/packages

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
