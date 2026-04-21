<h1 align="center">
  <img src="./public/logo.png" alt="墨梅ブログ" width="128" />
  <br />
  墨梅ブログ
</h1>
<p align="center">
  <img alt="Version" src="https://img.shields.io/github/package-json/v/CaoMeiYouRen/momei.svg" />
  <a href="https://hub.docker.com/r/caomeiyouren/momei" target="_blank">
    <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/caomeiyouren/momei">
  </a>
  <a href="https://app.codecov.io/gh/CaoMeiYouRen/momei" target="_blank">
    <img alt="Codecov" src="https://img.shields.io/codecov/c/github/CaoMeiYouRen/momei">
  </a>
  <a href="https://github.com/CaoMeiYouRen/momei/actions?query=workflow%3ARelease" target="_blank">
    <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/CaoMeiYouRen/momei/release.yml?branch=master">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D20-blue.svg" />
  <a href="https://docs.momei.app/ja-JP/" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/momei/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/momei/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/CaoMeiYouRen/momei?color=yellow" />
  </a>
  <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank">
    <img alt="License: CC BY-NC-SA 4.0" src="https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg" />
  </a>
</p>

<p align="center">
  <a href="./README.md">简体中文</a> |
  <a href="./README.zh-TW.md">繁體中文</a> |
  <a href="./README.en-US.md">English</a> |
  <a href="./README.ko-KR.md">한국어</a> |
  <a href="./README.ja-JP.md">日本語</a>
</p>

<p align="center">
  <a href="https://momei.app/"><strong>🌐 メインサイト</strong></a> &nbsp;|&nbsp;
  <a href="https://docs.momei.app/ja-JP/"><strong>📚 ドキュメントサイト</strong></a>
</p>

> **墨梅ブログ - AI 駆動・ネイティブ国際化対応の開発者向けブログプラットフォーム。**
>
> **AI Powered, Global Creation.**

## 📖 概要

墨梅ブログは **Nuxt** をベースに構築されたモダンなブログプラットフォームです。AI と深い国際化対応を通じて、技術開発者や越境コンテンツクリエイターに効率的で知的な制作体験を提供することを目指しています。スマート翻訳、自動要約、多言語ルーティング管理まで、墨梅はグローバルな読者とつながるための基盤を整えます。

## ✨ 主な特徴

-   **AI 駆動**: AI アシスタントを深く統合し、全自動翻訳、スマートタイトル、要約生成などをサポートして執筆効率を大きく向上させます。
-   **マルチモーダルコンテンツワークフロー**: AI 配図、ASR、再利用可能な音声入力、Memos / WechatSync 手動配信、定期タスク自動化をすでにサポートし、着想収集から公開までの完全な導線をカバーします。
-   **ネイティブ国際化 (i18n)**: UI からコンテンツ管理まで多言語対応が深く統合されており、世界中の読者へ自然に届けられます。
-   **モダンな技術スタック**: Nuxt（Vue 3 + TypeScript）をベースに構築され、SSG / SSR ハイブリッドレンダリングをサポートします。
-   **スムーズな移行**: カスタム URL Slug（パス別名）をサポートし、旧ブログから移行する際の SEO 損失を最小限に抑えます。
-   **Markdown 創作**: リアルタイムプレビューと画像ドラッグ＆ドロップアップロードを備えた、簡潔で効率的な Markdown エディタを提供します。
-   **コンテンツ編成とブランド意味論**: ホームの「最新記事 + 人気記事」二段構成、記事ピン留め、フッター著作権設定の導線が整理されており、運営とブランド管理に適しています。
-   **多層サブスクリプション**: 全体、カテゴリ、タグ単位の多次元 RSS 購読をサポートし、多言語検出にも対応します。
-   **コメントの読み取り専用翻訳**: コメント欄では現在の UI 言語に合わせた AI 訳文を表示でき、原文切替、言語ラベル、キャッシュ再利用、既存の配額 / レート制限ガバナンスも維持します。
-   **構成可能なシステムガバナンス**: 設定センター、環境変数ロック、設定監査ログ、デプロイガイドが連動しており、自前運用と Serverless シナリオを統一して管理できます。
-   **クラウド資産配信**: S3 / R2 直接アップロード認可、公開アセット URL ガバナンス、ユーザー / 記事単位のオブジェクトキー戦略をサポートし、CDN やストレージバックエンドの切り替えを容易にします。

## 🏠 オンライン体験

-   **デモサイト**: [https://demo.momei.app/](https://demo.momei.app/)

    -   メールアドレス `admin@example.com`、パスワード `momei123456` でデモ管理者アカウントにログインできます。

-   **正式サイト**: [https://momei.app/](https://momei.app/)

    -   自分のアカウントを登録して、一般ユーザー視点でプロダクトを体験できます。

-   **ドキュメントサイト**: [https://docs.momei.app/ja-JP/](https://docs.momei.app/ja-JP/)
-   **質問・コミュニティ**:
    -   QQ グループ: [807530287](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=K3QRQlxv_y7KqLhdEZmfouxKv9WHLN_v&authKey=pfdJX4EkvKGQXQrtM5BR968EbtFc9WnVvz8AtLiSUTGZRgw3P1wBWESSDcEjoCZB&noverify=0&group_code=807530287)
    -   Discord: [CaoMeiYouRen's Community](https://discord.gg/6bfPevfyr6)

**ページスクリーンショット**

![QQスクリーンショット1](https://oss.cmyr.dev/images/20251221221052130.png)

![QQスクリーンショット2](https://oss.cmyr.dev/images/20251221221240366.png)

![QQスクリーンショット3](https://oss.cmyr.dev/images/20251221221300973.png)

## 🛠️ 技術スタック

-   **コアフレームワーク**: [Nuxt](https://nuxt.com/)
-   **UI フレームワーク**: [Vue 3](https://vuejs.org/)
-   **プログラミング言語**: [TypeScript](https://www.typescriptlang.org/)
-   **スタイルプリプロセッサ**: [SCSS](https://sass-lang.com/)
-   **パッケージマネージャー**: [PNPM](https://pnpm.io/)
-   **コード規範**: ESLint + Stylelint + Conventional Commits

## 📂 プロジェクト構造

-   `components/`: 再利用可能な Vue コンポーネント
-   `pages/`: ファイルベースのページルート
-   `layouts/`: ページレイアウトテンプレート
-   `server/`: Nitro サーバー API インターフェースとエンティティ
-   `database/`: データベース初期化スクリプトとリソース
-   `i18n/`: 国際化言語設定ファイル
-   `utils/`: 共有ユーティリティ関数と共通ロジック
-   `styles/`: グローバル SCSS スタイル定義
-   `types/`: TypeScript インターフェースと型定義
-   `docs/`: プロジェクト詳細ドキュメントと規範説明
-   `packages/cli/`: Hexo 移行ツール CLI（独立プロジェクト）

## 🤖 AI 協調開発 (AI Synergy)

本プロジェクトは AI 支援開発フローを深く統合しています。人間の開発者でも AI エージェントでも、ここで最も効率的な協業方法を見つけられます。

- **もしあなたが開発者なら (Human)**:
  - 🚀 **[現代 AI 開発ガイド（中国語原文）](https://docs.momei.app/guide/ai-development)** - AI エージェントを指揮して反復的な作業の 80% を処理する方法を確認できます。
  - 🛠️ **[環境構築（従来方式・中国語原文）](https://docs.momei.app/guide/development)** - 詳細なローカル環境設定と手動開発手順を確認できます。
- **もしあなたが AI エージェントなら (AI Agent / LLM)**:
  - 📜 **[AGENTS.md](./AGENTS.md)** - 唯一のプロジェクトレベル AI 事実源です。まずこれを読み、その後に他の入口説明を実行してください。
  - 🧭 現在のプラットフォームに専用アダプタファイルや Rules がある場合は、ツール差分の補足としてのみ扱ってください。`AGENTS.md` と矛盾する場合は常に `AGENTS.md` を優先します。
  - 🗺️ **[プロジェクトマップ](./docs/index.md)** - プロジェクトの文脈をすばやく把握できます。
  - プロジェクト内蔵の **PDTFC+ サイクル** に従って作業してください。

## 📚 ドキュメント

詳細な開発・設計文書は [**墨梅ブログドキュメントサイト**](https://docs.momei.app/ja-JP/) を参照してください。

現在の `ja-JP` ドキュメントは段階的同期を採用しており、README、クイックスタート、デプロイ、翻訳ガバナンス、ロードマップ要約を優先公開しています。未同期ページや詳細設計は中国語原文を優先してください。

主なセクション:

-   [**クイックスタート**](https://docs.momei.app/ja-JP/guide/quick-start) - ワンクリック展開と起動
-   [**デプロイガイド**](https://docs.momei.app/ja-JP/guide/deploy) - コア変数、推奨デプロイ先、Cloudflare 周辺能力の境界
-   [**翻訳ガバナンス**](https://docs.momei.app/ja-JP/guide/translation-governance) - ja-JP の公開範囲と未翻訳ページの扱い
-   [**ロードマップ要約**](https://docs.momei.app/ja-JP/plan/roadmap) - 日本語で公開中の進捗サマリー
-   [**比較ガイド（中国語原文）**](https://docs.momei.app/guide/comparison) - なぜ墨梅を選ぶのか？
-   [**環境とシステム設定（中国語原文）**](https://docs.momei.app/guide/variables) - 環境変数、設定センターマッピング、ロック戦略
-   [**開発ガイド（中国語原文）**](https://docs.momei.app/guide/development) - 環境構築と貢献
-   [**API 設計（中国語原文）**](https://docs.momei.app/design/api) - インターフェース規範と定義
-   [**データベース設計（中国語原文）**](https://docs.momei.app/design/database) - テーブル構造と関係

## 📦 依存要件

-   Node.js >= 20
-   PNPM（推奨）

## ☁️ デプロイ説明

### サポート状況

Vercel、Netlify、Docker、または自己ホスト Node 環境へのデプロイを推奨します。Cloudflare 連携が必要な場合、現時点では R2 オブジェクトストレージや Scheduled Events などの周辺機能に限定して使うのが安全です。TypeORM と Node ランタイム依存のため、現在のバージョンはアプリ本体を Cloudflare Pages / Workers に完全配置することをサポートしていません。

現在のバージョンのデプロイ設定は環境変数が中心です。まず [デプロイガイド](https://docs.momei.app/ja-JP/guide/deploy) と [環境とシステム設定（中国語原文）](https://docs.momei.app/guide/variables) を読み、`AUTH_SECRET`、公開 URL、`DATABASE_URL` などのコア変数を整えたうえで、必要に応じて AI、オブジェクトストレージ、ASR、Webhook 定期タスクなどの拡張機能を有効化してください。

下のボタンから Vercel にワンクリックでデプロイできます。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fmomei)

### データベースサポート

墨梅は以下のデータベースをネイティブにサポートします。

-   **SQLite**: デフォルトの選択肢で、サーバー設定が不要なため個人ブログに適しています。`DATABASE_URL=sqlite://database/momei.sqlite` の設定を推奨します。
-   **MySQL / PostgreSQL**: より高いデータ管理要件があるユーザー向けで、`DATABASE_URL` のプロトコルヘッダーから自動判定されます。
-   **Cloudflare D1**: 計画中です。この計画は現バージョンで Cloudflare ランタイム全体を正式にサポートしていることを意味しません。現段階では外部データベースを使い、アプリ本体は Vercel、Docker、または自己ホスト Node 環境に配置することを推奨します。

詳細は [デプロイガイド](https://docs.momei.app/ja-JP/guide/deploy) を参照してください。

## 🔄 Hexo 移行ツール

墨梅は Hexo ブログシステムから記事をすばやく移行するための独立 CLI ツールを提供します。

### 機能特性

- ✅ ディレクトリ内のすべての Markdown ファイルを再帰的にスキャン
- ✅ Hexo Front-matter（YAML 形式）を正確に解析
- ✅ 公開日時、カテゴリ、タグなどのメタデータを保持
- ✅ API Key によるバッチインポートをサポート
- ✅ 並列インポートをサポートして効率を向上
- ✅ Dry Run モードによるプレビューをサポート

### クイック使用

```bash
# CLI ディレクトリに入る
cd packages/cli

# 依存関係をインストール
pnpm install

# ツールをビルド
pnpm build

# プレビューインポート（実際には取り込まない）
pnpm start import ./hexo-blog/source/_posts --dry-run --verbose

# 正式インポート
pnpm start import ./hexo-blog/source/_posts \
  --api-url https://your-blog.com \
  --api-key your-api-key-here
```

詳細な使用説明は [packages/cli/README.md](./packages/cli/README.md) を参照してください。

## 🚀 クイックスタート

### 依存関係のインストール

```bash
pnpm install
```

### 開発サーバーの起動

```bash
pnpm dev
```

### 本番ビルド

```bash
pnpm build
```

### テストの実行

```bash
pnpm test
```

### コードチェック

```bash
pnpm lint
pnpm lint:i18n
```

## 👤 作者

**CaoMeiYouRen**

-   Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)
-   GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)

## 🤝 貢献

貢献、質問、新機能提案を歓迎します。
不明点があれば [Issues](https://github.com/CaoMeiYouRen/momei/issues) を確認してください。
貢献ガイドは [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## 💰 サポート

このプロジェクトが役に立った場合は ⭐️ を付けていただけると嬉しいです。ありがとうございます。

<a href="https://afdian.com/@CaoMeiYouRen">
  <img src="https://oss.cmyr.dev/images/202306192324870.png" width="312px" height="78px" alt="愛発電でサポート">
</a>

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/momei&type=Date)](https://star-history.com/#CaoMeiYouRen/momei&Date)

## 📝 License

Copyright © 2025 [CaoMeiYouRen](https://github.com/CaoMeiYouRen).

本プロジェクトはデュアルライセンスです。
- コード部分: [MIT](./LICENSE) ライセンス。
- ドキュメント部分: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ja) ライセンス。

**本プロジェクトの Logo は上記ライセンスの対象外です。画像の著作権はプロジェクト所有者 [CaoMeiYouRen](https://github.com/CaoMeiYouRen) が保有します。商用利用する場合は Logo を差し替える必要があります。非商用利用は、プロジェクト所有者の権益を害しない範囲で許可されます。**

---

_This README was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
