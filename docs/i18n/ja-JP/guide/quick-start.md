---
source_branch: master
last_sync: 2026-03-22
---

# クイックスタート

::: warning Translation Notice
このページは [中国語原文](../../../guide/quick-start.md) を基準に翻訳しています。差異がある場合は原文を優先してください。
:::

このガイドでは、Momei を最短で起動して公開する方法をまとめます。

## 0. 最小構成での起動パス

最初のデプロイでは、AI、ストレージ、メール、通知を一度に全部設定しようとしないでください。まずは 1 本の最小パスを通し、その後で段階的に広げる方が安全です。

| パス | 向いているケース | 初回起動前に最低限確認すること | 後回しにできるもの |
| :--- | :--- | :--- | :--- |
| ローカル開発 | まず画面を見たい、コードを触りたい、機能確認をしたい | `pnpm install`、`pnpm dev`。開発モードでは一時的な `AUTH_SECRET` とローカル SQLite が自動補完されます | AI、オブジェクトストレージ、メール、定期実行 |
| Vercel | 最速で公開サイトを立ち上げたい | `AUTH_SECRET`、`NUXT_PUBLIC_SITE_URL`、`NUXT_PUBLIC_AUTH_BASE_URL`、外部 `DATABASE_URL` | AI、オブジェクトストレージ、メール、分析 |
| Docker / 自己ホスト Node | ディスクや運用制御を持ちたい | `AUTH_SECRET`、`NUXT_PUBLIC_SITE_URL`、`NUXT_PUBLIC_AUTH_BASE_URL`。SQLite を使う場合は DB パスやマウントが永続化されること | AI、オブジェクトストレージ、メール、分析 |

初回起動前の確認ポイント:

1. 本番ではまず `AUTH_SECRET`、`NUXT_PUBLIC_SITE_URL`、`NUXT_PUBLIC_AUTH_BASE_URL` を先に埋めます。
2. Vercel などの Serverless では既定の SQLite を使い続けないでください。Cloudflare Pages / Workers はアプリ本体の実行先としてまだ未対応です。
3. Serverless で `STORAGE_TYPE=local` を残すと、後でアップロードやメディア処理が失敗します。
4. インストールウィザードに blocker が出たら、[デプロイガイド](./deploy.md) と中国語原文の [環境変数と設定の対応表](../../../guide/variables.md) を先に照合してください。

## 1. Vercel にワンクリックでデプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

1. 上のボタンをクリックします。
2. GitHub リポジトリを作成または選択します。
3. 少なくとも `AUTH_SECRET`、`NUXT_PUBLIC_SITE_URL`、`NUXT_PUBLIC_AUTH_BASE_URL`、外部 `DATABASE_URL` を設定します。
4. `Deploy` を実行します。

## 2. Docker ですばやく起動する

### 2.1 単体起動

```bash
docker run -d -p 3000:3000 caomeiyouren/momei
```

本番用途では少なくとも次を追加してください。

```bash
docker run -d -p 3000:3000 \
    -e AUTH_SECRET=your-random-secret \
    -e NUXT_PUBLIC_SITE_URL=https://blog.example.com \
    -e NUXT_PUBLIC_AUTH_BASE_URL=https://blog.example.com \
    caomeiyouren/momei
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

ただし、この zero-config はローカル開発専用です。公開デプロイ、OAuth コールバック、絶対公開 URL が必要になった時点で、上の最小パスに戻ってコア変数を明示してください。

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
