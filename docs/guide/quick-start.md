# 快速开始 (Quick Start)

欢迎使用墨梅博客！本页将引导你通过最快的方式部署并运行你的博客。

## 0. 最小可运行路径

先不要一口气把所有 AI、存储、通知能力都配完。首次部署只需要先跑通一条最小路径：

| 路径 | 什么时候选它 | 首次启动前至少确认 | 暂时可以后置 |
| :--- | :--- | :--- | :--- |
| 本地开发 | 想先看效果、改代码、验证功能 | `pnpm install`、`pnpm dev`；开发环境允许自动生成临时 `AUTH_SECRET`，数据库默认回退到本地 SQLite | AI、对象存储、邮件、定时任务 |
| Vercel | 想最快上线一个可访问站点 | `AUTH_SECRET`、`NUXT_PUBLIC_SITE_URL`、`NUXT_PUBLIC_AUTH_BASE_URL`、外部 `DATABASE_URL` | AI、对象存储、邮件、统计 |
| Docker / 自托管 Node | 需要更强的可控性、本地磁盘或自定义运维 | `AUTH_SECRET`、`NUXT_PUBLIC_SITE_URL`、`NUXT_PUBLIC_AUTH_BASE_URL`；若用 SQLite，先确认数据库目录 / 挂载卷可持久化 | AI、对象存储、邮件、统计 |

首次启动前的最小体检建议：

1. 核心变量先齐：正式部署至少补齐 `AUTH_SECRET`、`NUXT_PUBLIC_SITE_URL`、`NUXT_PUBLIC_AUTH_BASE_URL`。
2. 平台路径先对：Vercel / 其他 Serverless 路径不要继续依赖默认 SQLite；Cloudflare Pages / Workers 当前不支持整站主体部署。
3. 存储策略先收敛：Serverless 路径不要把 `STORAGE_TYPE` 留在 `local`，否则上传和媒体链路会在后续使用时失效。
4. 看不懂报错时：优先对照 [部署指南](./deploy.md) 的“核心必填”和“排障指引”，再结合 [环境配置与系统设置映射](./variables.md) 定位变量名。

## 1. 一键部署到 Vercel (推荐)

如果你希望在几分钟内拥有一个在线博客，这是最简单的方式。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

1. 点击上方按钮。
2. 按照 Vercel 的指引创建或选择你的 GitHub 仓库。
3. 至少补齐 `AUTH_SECRET`、`NUXT_PUBLIC_SITE_URL`、`NUXT_PUBLIC_AUTH_BASE_URL` 和外部 `DATABASE_URL`。
4. 点击 **Deploy**。

## 2. 使用 Docker 快速部署

我们为墨梅提供了官方的 Docker 镜像。

### 2.1 基础运行

```bash
docker run -d -p 3000:3000 caomeiyouren/momei
```

正式环境至少补齐：

```bash
docker run -d -p 3000:3000 \
    -e AUTH_SECRET=your-random-secret \
    -e NUXT_PUBLIC_SITE_URL=https://blog.example.com \
    -e NUXT_PUBLIC_AUTH_BASE_URL=https://blog.example.com \
    caomeiyouren/momei
```

### 2.2 使用 Docker Compose (推荐)

在本地创建一个 `docker-compose.yml` 文件：

```yaml
version: "3.8"
services:
    momei:
        image: caomeiyouren/momei
        ports:
            - "3000:3000"
        environment:
            - NODE_ENV=production
            - AUTH_SECRET=your-random-secret-key # 生产环境必须配置
        volumes:
            - ./database:/app/database # 持久化存储 SQLite 数据
            - ./uploads:/app/public/uploads # 持久化存储上传的文件
```

然后运行：

```bash
docker-compose up -d
```

## 3. Cloudflare 外围能力接入（非整站部署）

当前版本暂不支持将应用主体完整部署到 Cloudflare Pages / Workers。原因是项目当前仍依赖 TypeORM 与 Node 运行时能力，尚未形成可维护的 Cloudflare 适配层。

详细阻塞清单、最小样机边界与后续触发条件见 [Cloudflare 运行时兼容研究与止损结论](../design/modules/cloudflare-runtime-study.md)。

如果你需要使用 Cloudflare，当前建议仅接入以下外围能力：

- Cloudflare R2 作为对象存储。
- Cloudflare Scheduled Events 相关触发适配设计，用于统一任务入口的外围集成评估。
- CDN、WAF、DNS 等与应用主体运行时解耦的边缘能力。

应用主体请优先部署在 Vercel、Docker 或自托管 Node 环境，再结合 [部署指南](./deploy.md) 评估 Cloudflare 侧补充能力。

## 4. 本地开发 (零配置启动)

如果你想在本地开发或修改代码：

```bash
# 1. 克隆仓库
git clone https://github.com/CaoMeiYouRen/momei.git
cd momei

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev
```

墨梅支持开发环境 **零配置启动**：
- 自动使用本地 SQLite 数据库。
- 自动生成开发用的 `AUTH_SECRET`。
- 无需配置 `.env` 即可直接运行。

注意：这个“零配置”只适用于本地开发，不等同于正式部署。只要准备上线、接入 OAuth 或生成公开链接，就应该回到上面的最小路径，显式补齐核心环境变量。

如需启用完整功能，建议基于 `.env.full.example` 配置，并以设置服务映射为准，重点关注 `AI_QUOTA_ENABLED`、`AI_QUOTA_POLICIES`、`ASSET_PUBLIC_BASE_URL`、`MEMOS_INSTANCE_URL`、`MEMOS_ACCESS_TOKEN`、`LISTMONK_INSTANCE_URL`、`LISTMONK_ACCESS_TOKEN` 等变量。

浏览器访问 `http://localhost:3000` 即可查看效果。

## 5. 下一步

-   **进入后台**: 访问 `/admin` 登录管理端。如果是全新安装，请参考控制台日志中的初始化账号信息。
-   **开启 AI 助手**: 在 `.env` 中配置 `AI_API_KEY` 以启用智能标题生成和一键翻译功能。
-   **启用 Memos 同步**: 配置 `MEMOS_ENABLED=true`、`MEMOS_INSTANCE_URL`、`MEMOS_ACCESS_TOKEN`。
-   **启用 listmonk Newsletter 分发**: 在系统设置 -> 第三方集成中启用 `listmonk`，填写实例地址、管理员用户名、Access Token，并设置默认列表 ID 或分类 / 标签映射。
-   **体验 Demo 模式**: 设置 `NUXT_PUBLIC_DEMO_MODE=true` 即可在内存中快速体验管理后台的所有功能（不保存数据）。

如果你要验证 Newsletter 外部分发的最小链路，推荐按下面顺序操作：

1. 在后台配置 `LISTMONK_*` 对应设置，至少补齐实例地址、用户名、Access Token 和默认列表 ID。
2. 通过文章重推或营销 Campaign 发送入口触发一次发送。
3. 再次触发同一 Campaign 时，系统会优先复用已回写的远端 Campaign ID 进行更新，而不是重复创建。
4. 打开“通知投递审计”，按 `listmonk` 渠道查看最后一次投递结果、失败原因与人工处理建议。

---

::: tip 提示
更详细的配置和功能介绍，请查看 [部署指南](./deploy.md) 和 [功能特性](./features.md)。
:::
