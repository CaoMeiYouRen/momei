<h1 align="center">
  <img src="./public/logo.png" alt="Momei" width="128" />
  <br />
  Momei
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
  <a href="https://docs.momei.app/ja-JP/"><strong>📚 ドキュメント</strong></a>
</p>

> **Momei - AI 駆動・ネイティブ国際化対応の開発者向けブログプラットフォーム**
>
> **AI Powered, Global Creation**

## 概要

Momei は Nuxt ベースのモダンなブログプラットフォームです。AI と深い国際化設計を組み合わせ、技術開発者やグローバルなクリエイター向けに、より効率的で知的な執筆体験を提供します。

## 主な特徴

- AI タイトル / 要約 / 翻訳 / タグ提案
- ASR、再利用可能な音声入力、AI 画像、Memos / WechatSync 手動配信、定期タスクを含むマルチモーダル制作フロー
- UI からコンテンツ管理まで一貫したネイティブ多言語対応
- Nuxt + Vue 3 + TypeScript ベースのモダンスタック
- カスタム Slug による SEO を意識した移行サポート

## クイックリンク

- ドキュメント: https://docs.momei.app/ja-JP/
- クイックスタート: https://docs.momei.app/ja-JP/guide/quick-start
- デプロイガイド: https://docs.momei.app/ja-JP/guide/deploy
- ロードマップ要約: https://docs.momei.app/ja-JP/plan/roadmap
- 翻訳ガバナンス: https://docs.momei.app/ja-JP/guide/translation-governance

## AI 協業

- 人間の開発者向け: [クイックスタート](./docs/i18n/ja-JP/guide/quick-start.md) と [翻訳ガバナンス](./docs/i18n/ja-JP/guide/translation-governance.md) を先に読むことを推奨します。
- AI エージェント向け: [AGENTS.md](./AGENTS.md) を読み、PDTFC+ フローに従ってください。

## 参加方法

- 貢献ガイド: [CONTRIBUTING.md](./CONTRIBUTING.md)
- メイン README: [README.md](./README.md)

## デプロイの要点

現時点では Vercel、Docker、自前の Node 環境が主なデプロイ先です。Cloudflare は R2 や Scheduled Events などの周辺機能用途に限定して扱うのが安全です。
