---
source_branch: master
last_sync: 2026-03-22
---

# クイックスタート

::: warning Translation Notice
このページは [中国語原文](../../../guide/quick-start.md) を基準に翻訳しています。差異がある場合は原文を優先してください。
:::

このガイドでは、Momei を最短で起動して公開する方法をまとめます。

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

ローカルで `docker-compose.yml` を作成します。

```yaml
version: "3.8"
services:
    momei:
        image: caomeiyouren/momei
        ports:
            - "3000:3000"
        environment:
            - NODE_ENV=production
            - AUTH_SECRET=your-random-secret-key # 本番環境では必須
        volumes:
            - ./database:/app/database # SQLite データを永続化
            - ./uploads:/app/public/uploads # アップロードを永続化
```

```bash
docker-compose up -d
```

## 3. Cloudflare 周辺機能の活用

現行バージョンでは、アプリ本体を Cloudflare Pages / Workers に完全デプロイすることは推奨していません。TypeORM と Node ランタイム依存があるためです。

Cloudflare を使う場合は、現時点では次の周辺機能に限定するのが安全です。

- Cloudflare R2 をオブジェクトストレージとして利用する
- Scheduled Events まわりの統合設計を外周機能として評価する
- CDN、WAF、DNS など、アプリ本体ランタイムと切り離せるエッジ機能を使う

アプリ本体は Vercel、Docker、または自己ホストの Node 環境に配置し、必要に応じて [デプロイガイド](./deploy.md) を参照してください。

## 4. ローカル開発

```bash
git clone https://github.com/CaoMeiYouRen/momei.git
cd momei
pnpm install
pnpm dev
```

開発モードでは Zero-Config 起動を優先しており、ローカル SQLite と開発用 `AUTH_SECRET` が自動で補われます。

- ローカル SQLite を自動利用します
- 開発用 `AUTH_SECRET` を自動生成します
- `.env` を用意しなくても起動できます

完全な機能を有効にする場合は `.env.full.example` をベースに設定し、特に `AI_QUOTA_ENABLED`、`AI_QUOTA_POLICIES`、`ASSET_PUBLIC_BASE_URL`、`MEMOS_INSTANCE_URL`、`MEMOS_ACCESS_TOKEN`、`LISTMONK_INSTANCE_URL`、`LISTMONK_ACCESS_TOKEN` などを確認してください。

ブラウザで `http://localhost:3000` を開くと確認できます。

## 5. 次にやること

- **管理画面に入る**: `/admin` にアクセスして管理画面へログインします。新規インストール時はコンソールログの初期アカウント情報を確認してください。
- **AI アシスタントを有効化する**: `.env` に `AI_API_KEY` を設定すると、タイトル生成やワンクリック翻訳を利用できます。
- **Memos 同期を有効化する**: `MEMOS_ENABLED=true`、`MEMOS_INSTANCE_URL`、`MEMOS_ACCESS_TOKEN` を設定します。
- **listmonk 配信を有効化する**: システム設定 -> サードパーティ統合で `listmonk` を有効にし、インスタンス URL、管理者ユーザー名、Access Token、既定のリスト ID またはカテゴリ / タグ対応を設定します。
- **Demo モードを試す**: `NUXT_PUBLIC_DEMO_MODE=true` を設定すると、データを保存せずに管理画面の主要機能を体験できます。

Newsletter の最小外部分発フローを確認したい場合は、次の順で操作してください。

1. 管理画面で `LISTMONK_*` を設定し、少なくともインスタンス URL、ユーザー名、Access Token、既定リスト ID を補います。
2. 記事の再配信または Marketing Campaign の送信操作を 1 回実行します。
3. 同じ Campaign を再度送ると、システムは既存の遠端 Campaign ID を優先して再利用し、重複作成を避けます。
4. 「通知配信監査」を開き、`listmonk` チャンネルで直近の配信結果、失敗理由、手動対応の提案を確認します。

---

::: tip ヒント
より詳しい設定や機能説明は [デプロイガイド](./deploy.md) を参照してください。
:::
