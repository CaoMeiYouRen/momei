# 快速开始 (Quick Start)

欢迎使用墨梅 (Momei)！本页将引导你通过最快的方式部署并运行你的博客。

## 1. 一键部署到 Vercel (推荐)

如果你希望在几分钟内拥有一个在线博客，这是最简单的方式。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

1. 点击上方按钮。
2. 按照 Vercel 的指引创建或选择你的 GitHub 仓库。
3. 配置环境变量（可选，详见下方的环境变量说明）。
4. 点击 **Deploy**。

## 2. 使用 Docker 快速部署

我们为墨梅提供了官方的 Docker 镜像。

### 2.1 基础运行

```bash
docker run -d -p 3000:3000 caomeiyouren/momei
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

## 3. 本地开发 (零配置启动)

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

浏览器访问 `http://localhost:3000` 即可查看效果。

## 4. 下一步

-   **进入后台**: 访问 `/admin` 登录管理端。如果是全新安装，请参考控制台日志中的初始化账号信息。
-   **开启 AI 助手**: 在 `.env` 中配置 `AI_API_KEY` 以启用智能标题生成和一键翻译功能。
-   **体验 Demo 模式**: 设置 `NUXT_PUBLIC_DEMO_MODE=true` 即可在内存中快速体验管理后台的所有功能（不保存数据）。

---

::: tip 提示
更详细的配置和功能介绍，请查看 [部署指南](./deploy.md) 和 [功能特性](./features.md)。
:::
