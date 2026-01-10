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
            - DATABASE_TYPE=sqlite
            - DATABASE_PATH=/app/data/momei.sqlite # 默认使用本地 SQLite
        volumes:
            - ./data:/app/data # 持久化存储数据
```

然后运行：

```bash
docker-compose up -d
```

## 3. 本地运行

如果你想在本地预览或修改代码：

```bash
# 1. 克隆仓库
git clone https://github.com/CaoMeiYouRen/momei.git
cd momei

# 2. 安装依赖 (推荐使用 pnpm)
pnpm install

# 3. 启动开发服务器
pnpm dev
```

浏览器访问 `http://localhost:3000` 即可查看效果。

## 4. 下一步

-   **进入后台**: 访问 `/admin` 登录管理端（默认账号：admin / 密码：12345678）。
-   **配置 SEO**: 在管理后台设置站点标题和关键词。
-   **发布文章**: 开始你的第一篇 Markdown 创作。

---

::: tip 提示
更详细的配置和部署说明，请查看 [部署指南](./deploy.md)。
:::
