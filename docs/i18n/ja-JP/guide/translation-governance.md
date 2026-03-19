---
source_branch: master
last_sync: 2026-03-19
---

# 翻訳ガバナンスと貢献方針

::: warning Translation Notice
このページは [中国語原文](../../../guide/translation-governance.md) を基準に翻訳しています。差異がある場合は原文を優先してください。
:::

この文書は、Momei における ja-JP の初回導入範囲、用語、同期ルールを簡潔にまとめたものです。

## 1. 初回の公開範囲

ja-JP は現在 `ui-ready` 段階です。初回では次の範囲のみを公開します。

- README
- ドキュメントホーム
- クイックスタート
- 翻訳ガバナンス
- ロードマップ要約
- 公開 UI / 認証 / 設定 / インストール / 主要メールテンプレート

## 2. 用語の固定方針

- `Locale Registry`: 原文のまま保持
- `readiness`: 「公開段階」
- `fallback`: 「フォールバック」
- `translation_id`: 「翻訳関連 ID」
- `translation cluster`: 「翻訳クラスター」

## 3. 同期ルール

1. README、ドキュメントホーム、クイックスタート、翻訳ガバナンスは同一変更で更新します。
2. ロードマップは要約のみ提供し、詳細は中国語原文へリンクします。
3. まだ翻訳していないページは、空欄のまま公開せず、原文へのリンクを残します。

## 4. 提出前の最低確認

```bash
pnpm docs:check:i18n
pnpm lint
pnpm typecheck
```

必要に応じて i18n 監査や定向测试を追加してください。
