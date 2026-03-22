---
source_branch: master
last_sync: 2026-03-22
---

# デプロイガイド

::: warning Translation Notice
このページは [中国語原文](../../../guide/deploy.md) を基準にした要約ガイドです。差異がある場合は原文を優先してください。
:::

Momei のデプロイ構成は環境変数を中心に設計されており、多くの機能は対応する変数を設定するだけで有効化できます。

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

## 6. 関連ページ

- [クイックスタート](./quick-start.md)
- [翻訳ガバナンス](./translation-governance.md)
- [ロードマップ要約](../plan/roadmap.md)
- [中国語原文のデプロイガイド](../../../guide/deploy.md)
