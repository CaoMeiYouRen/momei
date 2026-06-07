# 隐私优先自托管分析集成评估（Umami）

> 评估日期: 2026-06-07  
> 评估对象: Umami (v3.1.0, MIT License)  
> 评估范围: Docker 部署方案的 go/no-go 决策

## 1. 评估结论

**结论：条件性 Go（推荐进入实施，但需在三个前置条件满足后启动）**

Umami 在资源开销、兼容性、接入复杂度三个维度均通过最低门槛。但当前项目使用 SQLite 作为默认数据库，需引入 PostgreSQL 服务（项目已内置 `pg` 驱动支持，切换成本可控）。建议在下个迭代中作为 P1 主线推进实施。

---

## 2. Umami 概况

| 属性 | 值 |
| :--- | :--- |
| 类型 | 隐私优先 Web 分析（Pageviews / 来源 / 设备 / 事件） |
| 许可证 | MIT（最宽松，允许商业使用、修改、再分发） |
| 最新版本 | v3.1.0 (2026-04-16) |
| GitHub Stars | 37.1k |
| 技术栈 | Next.js + Prisma + PostgreSQL |
| 追踪脚本大小 | ~2 KB（cookieless，无需 consent banner） |
| 自托管费用 | **完全免费** |

---

## 3. 资源开销评估

### 3.1 Umami 官方最低需求

| 资源 | 要求 | 说明 |
| :--- | :--- | :--- |
| CPU | 1 vCPU | 个人博客完全足够 |
| RAM | 512 MB - 1 GB | Node.js + PostgreSQL 基础开销 |
| 磁盘 | ~1 GB（应用+依赖）+ 数据增量 | 按 ~10K PV/月估算，数据年增量 < 100 MB |
| 数据库 | PostgreSQL 12.14+（必须） | 自 v3.0 起不再支持 MySQL |

### 3.2 社区实践验证

> 来源: [openpanel.dev](https://openpanel.dev/articles/self-hosted-web-analytics), [deepakness.com](https://deepakness.com/blog/self-hosting-umami-analytics/)

- **$5/月 VPS**（1 vCPU / 1 GB RAM）可稳定运行中小型站点（<100K PV/月）
- Docker Compose 部署仅需 `docker compose up -d` 一条命令

### 3.3 对 momei 项目的影响

- **增量**: 约需额外 512 MB RAM + 1 GB 磁盘（含 PostgreSQL 基础镜像）
- **总开销**: momei 当前单体 Docker 容器约占用 256-512 MB RAM，加上 Umami + PostgreSQL 后总计约 1-1.5 GB RAM
- **结论**: 对中型 VPS（2 GB RAM 以上）无压力，但仍需明确告知部署者新增的资源需求

---

## 4. 与现有 PostgreSQL 中间件的兼容性

### 4.1 momei 的数据库现状

| 属性 | 当前值 |
| :--- | :--- |
| ORM | TypeORM v1.0.0 |
| 默认数据库 | SQLite (`better-sqlite3`) |
| PostgreSQL 支持 | 已内置（`pg` 驱动已安装） |
| 数据库切换 | 仅需修改 `DATABASE_URL`（`sqlite://` → `postgresql://`） |
| Redis | 可选（`ioredis` 已安装，默认注释） |

### 4.2 Umami 的数据库需求

| 属性 | 值 |
| :--- | :--- |
| ORM | Prisma |
| 数据库 | PostgreSQL 12.14+（必须） |
| 数据库名 | 独立（建议 `umami`） |
| 表前缀 | 无（Umami 自带 schema） |

### 4.3 并存评估

**Umami 与 momei 必须使用独立的 PostgreSQL 数据库**，原因：
1. **ORM 不同**（TypeORM vs Prisma）——无法共用连接。
2. **表前缀冲突**——momei 使用 `momei_` 前缀，Umami 无前缀。
3. **迁移管理冲突**——两个独立的 schema 迁移系统。

**推荐方案**：同一个 PostgreSQL 实例，创建两个数据库：
- `momei` — momei 博客数据
- `umami` — Umami 分析数据

docker-compose 中仅需一个 PostgreSQL 容器。

### 4.4 Docker Compose 兼容性

**端口冲突**: momei 和 Umami 默认均使用 `3000` 端口。

解决方案：为 Umami 分配独立端口（如 `3001`），或使用 Nginx/Caddy 反向代理按域名分流（本项目目前无反向代理，可暂用独立端口）。

---

## 5. 与现有 GA4 / Clarity / 百度统计的并存策略

### 5.1 并存方案

| 方案 | 追踪方式 | 隐私影响 | 推荐度 |
| :--- | :--- | :--- | :--- |
| **方案 A: 全部启用** | 4 个追踪脚本并行 | 隐私合规风险（GA4/百度使用 cookie） | 低 |
| **方案 B: Umami 为主，其余按需** | 默认仅加载 Umami，GA4/百度/Clarity 可开关 | 用户可通过设置页灵活切换 | **推荐** |
| **方案 C: Umami 完全替代** | 移除 GA4/百度/Clarity | 最佳隐私合规 | 高（适合新部署者） |

**推荐方案 B**：在后台设置页新增 `umami_analytics` 字段（支持 Website ID + Script URL），与现有三个分析字段并列展示。部署者可根据需要选择开启任意组合。每个追踪脚本独立管理，互不干扰。

### 5.2 NUxT 插件集成路径

现有分析插件架构：

```
plugins/
├── baidu-analytics.client.ts    # 百度统计
├── google-analytics.client.ts   # GA4
├── clarity.client.ts            # Microsoft Clarity
└── umami-analytics.client.ts    # 新增 Umami ← 本方案
```

Umami 追踪脚本注入方式与现有 GA4 插件相同——动态创建 `<script>` 标签注入 `<head>`：

```typescript
// 伪代码：plugins/umami-analytics.client.ts
const { umamiScriptUrl, umamiWebsiteId } = runtimeConfig.public
if (umamiWebsiteId && import.meta.client) {
    const script = document.createElement('script')
    script.src = umamiScriptUrl || 'https://analytics.umami.is/script.js'
    script.setAttribute('data-website-id', umamiWebsiteId)
    script.async = true
    script.defer = true
    document.head.appendChild(script)
}
```

---

## 6. 后台设置页 Tracking Script 注入的接入复杂度

### 6.1 需修改文件清单

| 文件 | 改动 | 复杂度 |
| :--- | :--- | :--- |
| `types/setting.ts` | 新增 `SettingKey.UMAMI_ANALYTICS` | 低（1 行） |
| `server/services/setting.constants.ts` | 新增 env→setting 映射 | 低（1 行） |
| `.env.full.example` | 新增 `NUXT_PUBLIC_UMAMI_WEBSITE_ID` / `NUXT_PUBLIC_UMAMI_SCRIPT_URL` | 低（2 行） |
| `nuxt.config.ts` | 新增 runtimeConfig 字段 | 低（2 行） |
| `components/admin/settings/analytics-settings.vue` | 新增输入框 + 锁定逻辑 | 低（~15 行） |
| `server/api/settings/public.get.ts` | 新增公开字段 | 低（1 行） |
| `plugins/umami-analytics.client.ts` | **新文件**: 动态注入 Umami 追踪脚本 | 低（~25 行） |
| `app.vue` | 新增 Umami 域名的 dns-prefetch | 低（2 行） |
| `i18n/locales/*/admin-settings.json` | 新增翻译键 | 低（5 文件各 1 行） |
| `docker-compose.yml` | 新增 Umami + PostgreSQL 服务定义 | 中（~30 行） |

### 6.2 预估工时

| 模块 | 预估 |
| :--- | :--- |
| Schema + Env + Config | 0.5h |
| Settings UI | 0.5h |
| Nuxt Plugin | 0.5h |
| i18n（5 语言） | 0.5h |
| Docker Compose | 1h |
| 集成测试 + 文档 | 1h |
| **合计** | **4h** |

---

## 7. 风险与限制

| 风险 | 影响 | 缓解措施 |
| :--- | :--- | :--- |
| PostgreSQL 对 SQLite 用户的迁移成本 | 部署者需额外运行 PostgreSQL | 保留 SQLite 作为默认选项，PostgreSQL 仅作为 Umami 的依赖声明 |
| 端口冲突 (3000) | Umami 与 momei 默认同端口 | docker-compose 中为 Umami 映射 `3001:3000` |
| 维护双数据库负担 | 备份/监控需覆盖两个数据库 | PostgreSQL 实例统一管理，pg_dump 可同时备份两个库 |
| Umami 版本升级 | 跨大版本可能需手动迁移 | 定期关注 Release Notes；MIT 许可证允许 fork 锁定版本 |
| 追踪脚本被广告拦截器屏蔽 | 自托管域名可能被列入屏蔽列表 | 可通过反向代理将 `/umami.js` 映射到 Umami 容器，使用同域请求规避 |

---

## 8. 推荐实施路线

### Phase 0: 前置条件（本迭代）

- [ ] 在 `.env.full.example` 中新增 PostgreSQL 连接说明（注明 Umami 需独立数据库）
- [ ] 输出本评估文档供 reviewer 确认

### Phase 1: 核心集成（下个迭代，P1）

- [ ] 新增 `SettingKey.UMAMI_ANALYTICS` 和相关 env mapping
- [ ] 新增 `plugins/umami-analytics.client.ts`
- [ ] 后台设置页新增 Umami 配置字段
- [ ] 5 语言 i18n 翻译

### Phase 2: Docker 部署模板（P2，可选）

- [ ] `docker-compose.yml` 新增 Umami + PostgreSQL 服务定义
- [ ] 部署文档更新（README / 安装向导）

---

## 9. 参考来源

| 来源 | URL |
| :--- | :--- |
| Umami 官方文档 — 安装指南 | https://umami.is/docs/install |
| Umami GitHub 仓库 | https://github.com/umami-software/umami |
| Self-Hosted Web Analytics 2026 Comparison | https://openpanel.dev/articles/self-hosted-web-analytics |
| Umami on $3.50 VPS — Deployment Guide | https://deepakness.com/blog/self-hosting-umami-analytics/ |
