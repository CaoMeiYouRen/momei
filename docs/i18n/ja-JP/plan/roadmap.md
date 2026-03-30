---
source_branch: master
last_sync: 2026-03-31
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
- **第十八段階は監査完了でアーカイブ済み**: Firefox / WebKit / モバイルの主要経路検証、性能予算基線、`html-minifier` 高リスク依存チェーンの置換、管理画面 admin locale 大ファイル分割、`ja-JP` の `seo-ready` 昇格、WechatSync 微博互換と翻訳ワークフローのタグ進捗収束までを完了しました。
- **未上収項目の扱いを明確化**: 当初候補だった重複純関数 / 共有型断片の治理は、段階容量の都合で [中国語 backlog](../../../plan/backlog.md) に残し、次段階の准入で再評価します。
- **第十九段階は監査完了でアーカイブ済み**: Skills 可視性の層分け、回帰ログ索引と比較導線、重複純関数 / 共有型の初回収束、PostgreSQL トラフィック热点の観測と最小治理までを完了しました。残る serverless 直書き fallback は運用観測項目として扱い、段階阻塞にはしていません。
- **次段階はまだ正式化していません**: 新しい正式フェーズは中国語の `todo.md` / `roadmap.md` にまだ上収しておらず、准入評価が完了した後で改めて同期します。
- **`ja-JP` 正式整列は locale parity を収束済み**: `zh-CN` を基準にした parity スクリプト `scripts/i18n/check-locale-parity.mjs` と `pnpm i18n:check-sync` を導入し、管理画面 shell、`admin-ad`、`admin-external-links`、`admin-friend-links`、`admin-ai`、`admin-marketing`、`admin-settings`、`admin-posts`、`admin-snippets`、`admin-users`、`admin-submissions`、`admin-taxonomy`、`demo`、`feed` までを補完し、現在は `ja-JP: parity with zh-CN` まで収束しました。
- **readiness 昇格を完了しました**: locale 内容の収束後に、メール、SEO、サイトマップ、回帰検証の証跡を追加し、`ja-JP` は locale registry 上で `seo-ready` に昇格しました。今後は同等の検証を維持したまま運用します。
- **文書同期も段階的に進行中**: ja-JP では README、クイックスタート、デプロイ、翻訳ガバナンス、ロードマップ要約を優先同期し、未翻訳または未追従の領域は引き続き中国語原文を事実源とします。
- **要約ページとしての範囲**: 本ページは第十八・第十九段階のアーカイブ要約のみを保持し、詳細な受け入れ条件とタスク分解は中国語の `roadmap.md` と `todo.md` を優先します。

## 4. 参照先

- 完全版ロードマップ: [中国語原文](../../../plan/roadmap.md)
- 現在の Todo: [中国語 Todo](../../../plan/todo.md)
