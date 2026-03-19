---
source_branch: master
last_sync: 2026-03-10
---

# 資料庫設計

::: warning 翻譯說明
本頁對應 [中文原文](../../../design/database.md)。若內容有差異，請以中文原文為準。
:::

本文檔描述墨梅資料層的高層結構，重點說明主要實體、關聯、索引策略與多語內容的建模方式。

## 1. 設計目標

- 支援內容、使用者、互動、通知與設定等多類型資料
- 兼容多資料庫後端
- 為多語內容與翻譯簇管理預留清晰結構
- 在可讀性與擴展性之間保持平衡

## 2. 核心實體

### 2.1 使用者系統

- **User**：使用者主體，包含名稱、郵箱、角色、語言偏好等資訊
- **Account**：第三方登入帳號關聯
- **Session**：Session Token 與過期資訊
- **Verification**：驗證碼與重設流程資料
- **ApiKey**：外部發佈或整合所需的授權憑證

### 2.2 內容系統

- **Post**：文章主體，包含標題、內容、語言、`translationId`、狀態與可見性等欄位
- **PostVersion**：文章版本快照，用於有限版本化與回滾
- **Category** / **Tag**：分類與標籤，支援多語與翻譯簇
- **Comment**：評論內容與審核狀態

### 2.3 訂閱、營運與系統資料

- **Subscriber**：訂閱者與其語言偏好、分類 / 標籤訂閱關係
- **MarketingCampaign**：營銷與推送任務追蹤
- **AITask**：AI / ASR / TTS 等重任務狀態與結果
- **Setting**：系統設定鍵值
- **ThemeConfig**：主題配置方案

## 3. 多語內容建模

- `translationId` 用於將不同語言版本視為同一內容簇。
- `slug` 通常與 `language` 聯合唯一，以支持不同語言使用不同公開路徑。
- 當某語言版本不存在時，可依 `translationId` 回退到其他已存在語言。

## 4. 索引策略

常見索引包括：

- `User.email`、`User.username`
- `Session.token`
- `Post (slug, language)`
- `Category (slug, language)`
- `Tag (slug, language)`
- `Comment.postId`、`Comment.parentId`
- `Subscriber.email`

## 5. 維護原則

- 資料結構調整前，應同時評估對 API、前端與遷移工具的影響。
- 涉及多語、權限或通知矩陣的欄位變動，需同步更新對應設計文檔與測試。
- 若資料模型從摘要升級為更複雜形態，應優先補文檔再推進實作。