---
source_branch: master
last_sync: 2026-03-19
---

# デプロイガイド

::: warning Translation Notice
このページは [中国語原文](../../../guide/deploy.md) を基準にした簡易ガイドです。差異がある場合は原文を優先してください。
:::

## 1. 推奨デプロイ先

現時点で Momei の本体を動かす主な選択肢は次の三つです。

- Vercel
- Docker
- 自前の Node.js 環境

## 2. Cloudflare の扱い

Cloudflare は現在、アプリ本体の完全な実行先ではなく、周辺機能向けに扱うのが安全です。

- R2 オブジェクトストレージ
- Scheduled Events 連携
- CDN / WAF / DNS

TypeORM と Node ランタイム依存のため、Cloudflare Pages / Workers への全面移行はまだサポート対象ではありません。

## 3. 最低限の確認項目

1. `AUTH_SECRET` を設定する
2. データベース接続先を決める
3. 公開 URL を確定する
4. 必要であればストレージと AI を段階的に有効化する

## 4. 関連ページ

- [クイックスタート](./quick-start.md)
- [ロードマップ要約](../plan/roadmap.md)
- [中国語原文のデプロイガイド](../../../guide/deploy.md)
