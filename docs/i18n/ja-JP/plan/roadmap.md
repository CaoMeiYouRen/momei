---
source_branch: master
last_sync: 2026-03-22
---

# ロードマップ要約

::: warning Translation Notice
このページは [中国語原文](../../../plan/roadmap.md) を基準にした要約です。最新かつ完全な計画は中国語版を参照してください。
:::

## 1. プロジェクト概要

Momei は、AI 駆動・ネイティブ国際化対応の開発者向けブログプラットフォームです。目標は、コンテンツ制作、配信、多言語運用を一つのスタックで支えることです。

## 2. 完了済みの主な段階

- Stage 1-4: MVP、AI / i18n 強化、テーマ・コメント・レンダリング拡張、インストールウィザードと CLI 導入
- Stage 5-8: 通知、サブスクリプション、多媒体、MCP / Scheduled Tasks、設定統合、配信インフラ整備
- Stage 9-14: Locale Registry、設定説明層、SEO・ストレージ・AI 配額・通知行列・多言語治理などの基盤整理

## 3. 最新状況と次段階

- **第十六・第十七段階は監査完了でアーカイブ済み**: 規範の事実源整理、Review Gate の証跡強化、skills / agents ミラー統治、設定事実源の再利用、認証セッション治理、管理画面メールテンプレート、Serverless 長文翻訳の継続実行、AI ビジュアル資産収束、既存資産リンク移行ツールまでを収束しました。
- **第十七段階の収口補足**: release 依存リスクゲートと、管理画面の新規記事における空白ドラフトの言語切替回帰も同段階の収口修正として完了し、回帰ログに証跡を残しています。
- **第十八段階は正式に計画済み**: 多エンジンのブラウザ検証と性能予算基線、`html-minifier` 高リスク依存チェーンの置換、管理画面 admin locale 大ファイル分割、`ja-JP` の正式整列、重複する純関数 / 型断片の初回治理を重点に据えます。
- **`ja-JP` 正式整列は locale parity を収束済み**: `zh-CN` を基準にした parity スクリプト `scripts/i18n/check-locale-parity.mjs` と `pnpm i18n:check-sync` を導入し、管理画面 shell、`admin-ad`、`admin-external-links`、`admin-friend-links`、`admin-ai`、`admin-marketing`、`admin-settings`、`admin-posts`、`admin-snippets`、`admin-users`、`admin-submissions`、`admin-taxonomy`、`demo`、`feed` までを補完し、現在は `ja-JP: parity with zh-CN` まで収束しました。
- **次の判断ポイントは readiness 昇格です**: locale 内容はそろいましたが、`ui-ready` から先へ進むにはメール、SEO、サイトマップ、回帰検証の証跡が別途必要なため、registry の昇格は次の専用ラウンドで判断します。
- **文書同期も段階的に進行中**: ja-JP では README、クイックスタート、デプロイ、翻訳ガバナンス、ロードマップ要約を優先同期し、未翻訳または未追従の領域は引き続き中国語原文を事実源とします。
- **要約ページとしての範囲**: 本ページは第十八段階の要約のみを保持し、詳細な受け入れ条件とタスク分解は中国語の `roadmap.md` と `todo.md` を優先します。

## 4. 参照先

- 完全版ロードマップ: [中国語原文](../../../plan/roadmap.md)
- 現在の Todo: [中国語 Todo](../../../plan/todo.md)
