---
source_branch: master
last_sync: 2026-03-19
---

# クイックスタート

::: warning Translation Notice
このページは [中国語原文](../../../guide/quick-start.md) を基準に翻訳しています。差異がある場合は原文を優先してください。
:::

このガイドでは、Momei を最短で起動する方法をまとめます。

## 1. Vercel にワンクリックでデプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

1. 上のボタンをクリックします。
2. GitHub リポジトリを作成または選択します。
3. 必要に応じて環境変数を設定します。
4. `Deploy` を実行します。

## 2. Docker ですばやく起動する

### 2.1 単体起動

```bash
docker run -d -p 3000:3000 caomeiyouren/momei
```

### 2.2 Docker Compose

```yaml
version: "3.8"
services:
    momei:
        image: caomeiyouren/momei
        ports:
            - "3000:3000"
        environment:
            - NODE_ENV=production
            - AUTH_SECRET=your-random-secret-key
        volumes:
            - ./database:/app/database
            - ./uploads:/app/public/uploads
```

```bash
docker-compose up -d
```

## 3. ローカル開発

```bash
git clone https://github.com/CaoMeiYouRen/momei.git
cd momei
pnpm install
pnpm dev
```

開発モードでは Zero-Config 起動を優先しており、ローカル SQLite と開発用 `AUTH_SECRET` が自動で補われます。

## 4. 次に見るページ

- [翻訳ガバナンス](./translation-governance.md)
- [ロードマップ要約](../plan/roadmap.md)
- [中国語 Todo](../../../plan/todo.md)
