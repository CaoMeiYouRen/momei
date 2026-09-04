---
source_branch: master
last_sync: 2026-09-04
translation_tier: summary-sync
---

# 環境変数と設定マッピング (Variables & Settings Mapping)

::: warning Translation Notice
このページは [中国語原文](../../../guide/variables.md) を基準にした要約です。完全なマッピング表は原文を参照してください。
:::

## 1. 基本原則

### 1.1 設定の優先順位

Momei は **環境変数優先** の戦略を採用しています：

1. **環境変数 (ENV)**: 最優先。設定されている場合、データベースの値は無視され、管理画面では「読み取り専用」と表示されます。
2. **システム設定 (Database)**: 環境変数がない場合、データベースの `setting` テーブルから読み込みます。管理画面から変更可能です。
3. **ハードコードされたデフォルト値**: 上記がいずれも存在しない場合、コード内のデフォルト値を使用します。

### 1.2 設定レベル (Config Level)

| レベル | 説明 |
| :--- | :--- |
| Level 0 (公開) | 誰でも閲覧可能（サイト名、ロゴ等） |
| Level 1 (制限) | ログインユーザーのみ閲覧可能 |
| Level 2 (管理) | 管理者のみ閲覧可能（マスキング表示対応） |
| Level 3 (内部) | サーバーのみ参照可能。API では決して返されない（`AUTH_SECRET` 等） |

### 1.3 マスキング種別 (Mask Type)

- **none**: そのまま表示
- **password**: すべて伏せ字 (********)
- **key**: 前 4 桁と後 4 桁を表示、中間を伏せ字に
- **email**: メールアドレスをマスキング

## 2. 主な環境変数カテゴリ

| カテゴリ | 代表的な変数 | 説明 |
| :--- | :--- | :--- |
| 基本設定 | `NUXT_PUBLIC_APP_NAME`, `NUXT_PUBLIC_SITE_URL` | サイト名・URL・デフォルト言語等 |
| データベース | `DATABASE_URL` | SQLite / MySQL / PostgreSQL 対応 |
| 認証 | `AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GOOGLE_CLIENT_ID` | OAuth 認証とセッション管理 |
| AI | `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` | AI プロバイダー設定 |
| TTS/ASR | `TTS_PROVIDER`, `ASR_PROVIDER`, `VOLCENGINE_*` | 音声合成・音声認識設定 |
| メール | `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` | SMTP 設定 |
| ストレージ | `STORAGE_TYPE`, `S3_*`, `BLOB_READ_WRITE_TOKEN` | ファイル保存先 |
|  analytics | `NUXT_PUBLIC_BAIDU_ANALYTICS_ID` | アクセス解析設定 |
| レート制限 | `NUXT_RATE_LIMIT_*` | API レート制限の調整 |
| 運用 | `ADMIN_USER_IDS`, `CRON_SECRET` | 管理者権限・タスクスケジューラ |
| ログ集約 (Axiom) | `LOG_LEVEL`, `LOGFILES`, `LOG_DIR`, `AXIOM_DATASET_NAME`, `AXIOM_API_TOKEN` | Winston と `@axiomhq/winston` 経由で Axiom に送信。`LOGFILES` は Serverless 環境で自動無効化 |

## 3. 管理画面から設定可能な項目

環境変数で設定された値は管理画面の「システム設定」から確認できますが、環境変数が設定されている項目はロックされ編集できません。管理画面から設定可能な主なカテゴリ：

- サイト情報（名称・説明・キーワード・ロゴ等）
- AI 設定（プロバイダー・モデル・API キー等）
- メール設定（SMTP サーバー・認証情報等）
- ストレージ設定（ローカル / S3 / R2 / Vercel Blob）
- 認証設定（OAuth クライアントID・キャプチャ等）
- テーマ設定（カラー・背景・ダークモード等）
- 分析設定（Google Analytics / Baidu / Clarity / Umami）

> 完全なマッピング表（100+ の全環境変数と SettingKey の対応）は [中国語原文](../../../guide/variables.md) を参照してください。
