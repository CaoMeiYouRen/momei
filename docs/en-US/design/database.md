---
source_branch: master
last_sync: 2026-02-11
---

# Database Design

::: warning Translation Notice
This document has been translated from Chinese. In case of any discrepancy, the [original Chinese version](../../design/database.md) shall prevail.
:::

## 1. Overview

This document provides a detailed description of the Momei blog's database architecture. The project uses **TypeORM** for seamless multi-database support.

## 2. ER Diagram

```mermaid
erDiagram
    User ||--o{ Account : "has"
    User ||--o{ Session : "has"
    User ||--o| TwoFactor : "has"
    User ||--o{ Post : "authors"
    User ||--o{ Comment : "writes"
    User ||--o{ ApiKey : "has"
    User ||--o{ Subscriber : "is associated with"
    Post }o--|| Category : "belongs to"
    Post }o--o{ Tag : "has"
    Post ||--o{ Comment : "has"
    Comment }o--o| User : "written by (optional)"
    Comment }o--o| Comment : "reply to"
    Category }o--o| Category : "has parent"
    User ||--o{ ThemeConfig : "manages"
    User ||--o{ AITask : "triggers"
    MarketingCampaign ||--o{ Subscriber : "targets"
    Subscriber }o--o{ Category : "subscribed to"
    Subscriber }o--o{ Tag : "subscribed to"

    User {
        string id PK
        string name
        string email
        boolean emailVerified
        string image
        string username
        string role
        boolean banned
        string language
        string timezone
        datetime createdAt
        datetime updatedAt
    }

    Account {
        string id PK
        string userId FK
        string providerId
        string accountId
    }

    Session {
        string id PK
        string userId FK
        string token
        datetime expiresAt
        string ipAddress
        string userAgent
    }
```

## 3. Core Table Definitions

### 3.1 User System (via better-auth)

#### User
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | varchar | Primary Key (Snowflake). |
| `name` | text | Display name. |
| `email` | varchar | Unique email address. |
| `role` | varchar | User role: admin, author, user. |
| `banned` | boolean | Ban status. |

### 3.2 Blog Content

#### Post (Articles)
- **i18n Support**: Shared `translationId` for language variants.
- **Taxonomy**: Relations to `Category` and `Tag`.
- **Slugs**: Unique per language.

#### Category & Tag
- **Localization**: Supports multi-language translation.
- **Heirarchy**: Categories support parent-child relationships.

### 3.3 Messaging & Interaction

#### Comment
- **Threading**: Supports nested replies.
- **Anonymous**: Supports guest commenting with moderation.

#### Subscriber
- **Hub**: Manages email subscriptions synced with categories/tags.
