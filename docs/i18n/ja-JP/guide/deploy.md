---
source_branch: master
last_sync: 2026-03-22
---

# デプロイガイド

::: warning Translation Notice
このページは [中国語原文](../../../guide/deploy.md) を基準にした要約ガイドです。差異がある場合は原文を優先してください。
:::

Momei のデプロイ構成は環境変数を中心に設計されており、多くの機能は対応する変数を設定するだけで有効化できます。

## 0. デプロイ前チェック

初回デプロイでは、すべての設定を一度に埋めるのではなく、次の順で確認してください。

1. 先にデプロイ経路を決めます。
	- ローカル開発: zero-config 起動は可能ですが、開発確認専用です。
	- Vercel: 外部 `DATABASE_URL` に切り替え、既定 SQLite を使い続けないでください。
	- Docker / 自己ホスト Node: SQLite は利用可能ですが、DB と upload ディレクトリの永続化を先に確認します。
	- Cloudflare Pages / Workers: アプリ本体の実行先としては未対応で、R2 や Scheduled Events などの周辺統合に限定すべきです。
2. 次にコア変数を埋めます。
	- 本番では `AUTH_SECRET`、`NUXT_PUBLIC_SITE_URL`、`NUXT_PUBLIC_AUTH_BASE_URL` を最優先で設定します。
	- `NUXT_PUBLIC_SITE_URL` と `NUXT_PUBLIC_AUTH_BASE_URL` は本番では同一オリジンに揃えるのが基本です。
3. 最後に組み合わせの衝突を確認します。
	- Serverless + SQLite: 再デプロイや再起動でデータが失われるため、本番経路としては不適切です。
	- Serverless + `STORAGE_TYPE=local`: 起動してもアップロードやメディア処理が本番で失敗します。
	- DB 未接続: `DATABASE_URL`、SQLite パス権限、Docker マウント、外部 DB 到達性を最初に確認してください。

インストールウィザードの step 1 に blocker が出ている場合は、DB 初期化や管理者作成より先にそれを解消してください。

## 1. コア必須設定

次の項目が欠けると、起動失敗や認証・公開 URL 生成の異常につながります。

- `AUTH_SECRET`: Better Auth とサーバー署名の中核シークレット
- `NUXT_PUBLIC_SITE_URL`: 公開サイト URL
- `NUXT_PUBLIC_AUTH_BASE_URL`: Better Auth コールバック基底 URL
- `DATABASE_URL`: データベース接続文字列

## 2. 推奨デプロイ先

現時点で Momei の本体を動かす主な選択肢は次の三つです。

- Vercel
- Docker
- 自前の Node.js 環境

## 3. 本番で優先して補う設定

最低起動の後は、次のカテゴリを優先して埋めると運用が安定します。

- データベース / キャッシュ: `DATABASE_SYNCHRONIZE=false`、必要に応じて `REDIS_URL`
- AI と多模態: `AI_PROVIDER`、`AI_API_KEY`、`AI_MODEL`、`ASR_*`、`TTS_*`、`AI_QUOTA_*`
- ストレージ: `STORAGE_TYPE`、S3 / R2 / local / Vercel Blob 系の対応変数
- メールと通知: `EMAIL_*`、必要に応じて Web Push / listmonk 関連
- 定時タスク: `CRON_SECRET`、`TASKS_TOKEN`、`WEBHOOK_SECRET`

## 4. Cloudflare の扱い

Cloudflare は現在、アプリ本体の完全な実行先ではなく、周辺機能向けに扱うのが安全です。

- R2 オブジェクトストレージ
- Scheduled Events 連携
- CDN / WAF / DNS

TypeORM と Node ランタイム依存のため、Cloudflare Pages / Workers への全面移行はまだサポート対象ではありません。

## 5. 最低限の確認項目

1. `AUTH_SECRET` を設定する
2. データベース接続先を決める
3. 公開 URL を確定する
4. 必要であればストレージと AI を段階的に有効化する

## 6. よくある問題

- インストールウィザードの step 1 で止まる場合は、まずこのページのデプロイ前チェックと必須設定を照合してください。
- Vercel / Netlify で初回起動後にデータや管理者が消える場合は、既定 SQLite を使い続けていないか確認してください。Serverless では外部 `DATABASE_URL` が必要です。
- Vercel / Netlify でサイトは開くのにアップロードが失敗する場合は、`STORAGE_TYPE=local` が残っている可能性があります。`s3`、`r2`、`vercel_blob` へ切り替えてください。
- Cloudflare Pages / Workers で TypeORM や Node 互換性エラーが出るのは既知のプラットフォーム境界です。アプリ本体は Vercel、Docker、自己ホスト Node に置いてください。

## 7. 関連ページ

- [クイックスタート](./quick-start.md)
- [翻訳ガバナンス](./translation-governance.md)
- [ロードマップ要約](../plan/roadmap.md)
- [中国語原文のデプロイガイド](../../../guide/deploy.md)
