-- 墨梅 (Momei) SQLite 初始化脚本

-- 1. 用户表
CREATE TABLE "momei_user" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" varchar(255) NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT (0),
  "image" text,
  "username" varchar(128),
  "display_username" varchar(128),
  "is_anonymous" boolean NOT NULL DEFAULT (0),
  "phone_number" varchar(64),
  "phone_number_verified" boolean NOT NULL DEFAULT (0),
  "role" varchar(128) NOT NULL DEFAULT ('user'),
  "banned" boolean NOT NULL DEFAULT (0),
  "ban_reason" text,
  "ban_expires" integer,
  "language" varchar(16),
  "timezone" varchar(64),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_user_email" UNIQUE ("email"),
  CONSTRAINT "UQ_user_username" UNIQUE ("username"),
  CONSTRAINT "UQ_user_phone_number" UNIQUE ("phone_number")
);

-- 2. 账号表
CREATE TABLE "momei_account" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "account_id" varchar(255) NOT NULL,
  "provider_id" varchar(255) NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "access_token_expires_at" datetime,
  "refresh_token_expires_at" datetime,
  "scope" varchar(255),
  "password" varchar(255),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_account_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 3. 会话表
CREATE TABLE "momei_session" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "token" varchar(255) NOT NULL,
  "expires_at" datetime NOT NULL,
  "ip_address" varchar(45),
  "user_agent" text,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_session_token" UNIQUE ("token"),
  CONSTRAINT "FK_session_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 4. 验证码表
CREATE TABLE "momei_verification" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" datetime NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now'))
);

-- 5. 二步验证表
CREATE TABLE "momei_two_factor" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "secret" text NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_two_factor_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 6. JWKS 表
CREATE TABLE "momei_jwks" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "public_key" text NOT NULL,
  "private_key" text NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now'))
);

-- 7. 分类表
CREATE TABLE "momei_category" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "description" text,
  "parent_id" varchar(36),
  "language" varchar(10) NOT NULL DEFAULT ('zh-CN'),
  "translation_id" varchar(255),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_category_slug_language" UNIQUE ("slug", "language"),
  CONSTRAINT "UQ_category_name_language" UNIQUE ("name", "language"),
  CONSTRAINT "UQ_category_translation_language" UNIQUE ("translation_id", "language"),
  CONSTRAINT "FK_category_parent" FOREIGN KEY ("parent_id") REFERENCES "momei_category" ("id") ON DELETE SET NULL
);

-- 8. 标签表
CREATE TABLE "momei_tag" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "language" varchar(10) NOT NULL DEFAULT ('zh-CN'),
  "translation_id" varchar(255),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_tag_slug_language" UNIQUE ("slug", "language"),
  CONSTRAINT "UQ_tag_name_language" UNIQUE ("name", "language"),
  CONSTRAINT "UQ_tag_translation_language" UNIQUE ("translation_id", "language")
);

-- 9. 文章表
CREATE TABLE "momei_post" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "summary" text,
  "cover_image" text,
  "status" varchar(20) NOT NULL DEFAULT ('draft'),
  "language" varchar(10) NOT NULL DEFAULT ('zh-CN'),
  "translation_id" varchar(255),
  "visibility" varchar(20) NOT NULL DEFAULT ('public'),
  "password" varchar(255),
  "views" integer NOT NULL DEFAULT (0),
  "copyright" text,
  "published_at" datetime,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "author_id" varchar(36) NOT NULL,
  "category_id" varchar(36),
  CONSTRAINT "UQ_post_slug_language" UNIQUE ("slug", "language"),
  CONSTRAINT "FK_post_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_post_category" FOREIGN KEY ("category_id") REFERENCES "momei_category" ("id") ON DELETE SET NULL
);

-- 10. 文章-标签中间表
CREATE TABLE "momei_post_tags_momei_tag" (
  "momei_post_id" varchar(36) NOT NULL,
  "momei_tag_id" varchar(36) NOT NULL,
  PRIMARY KEY ("momei_post_id", "momei_tag_id"),
  CONSTRAINT "FK_post_tags_post" FOREIGN KEY ("momei_post_id") REFERENCES "momei_post" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_post_tags_tag" FOREIGN KEY ("momei_tag_id") REFERENCES "momei_tag" ("id") ON DELETE CASCADE
);

-- 11. 评论表
CREATE TABLE "momei_comment" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "post_id" varchar(36) NOT NULL,
  "author_id" varchar(36),
  "parent_id" varchar(36),
  "content" text NOT NULL,
  "author_name" varchar(100) NOT NULL,
  "author_email" varchar(255) NOT NULL,
  "author_url" varchar(255),
  "status" varchar(20) NOT NULL DEFAULT ('published'),
  "ip" varchar(45),
  "user_agent" text,
  "is_sticked" boolean NOT NULL DEFAULT (0),
  "likes" integer NOT NULL DEFAULT (0),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_comment_post" FOREIGN KEY ("post_id") REFERENCES "momei_post" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_comment_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id") ON DELETE SET NULL,
  CONSTRAINT "FK_comment_parent" FOREIGN KEY ("parent_id") REFERENCES "momei_comment" ("id") ON DELETE CASCADE
);

-- 12. API Key 表
CREATE TABLE "momei_api_key" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "key" text NOT NULL,
  "prefix" varchar(16) NOT NULL,
  "last_used_at" datetime,
  "expires_at" datetime,
  "user_id" varchar(36) NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_api_key_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 13. 订阅者表
CREATE TABLE "momei_subscriber" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL,
  "is_active" boolean NOT NULL DEFAULT (1),
  "language" varchar(10) NOT NULL DEFAULT ('zh-CN'),
  "user_id" varchar(36),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_subscriber_email" UNIQUE ("email"),
  CONSTRAINT "FK_subscriber_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE SET NULL
);

-- 14. 系统设置表
CREATE TABLE "momei_setting" (
  "key" varchar(128) PRIMARY KEY NOT NULL,
  "value" text,
  "description" varchar(255),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now'))
);

-- 索引
CREATE INDEX "IDX_post_author" ON "momei_post" ("author_id");
CREATE INDEX "IDX_post_category" ON "momei_post" ("category_id");
CREATE INDEX "IDX_api_key_user" ON "momei_api_key" ("user_id");
CREATE INDEX "IDX_subscriber_user" ON "momei_subscriber" ("user_id");
CREATE INDEX "IDX_post_slug_language" ON "momei_post" ("slug", "language");
CREATE INDEX "IDX_category_slug_language" ON "momei_category" ("slug", "language");
CREATE INDEX "IDX_tag_slug_language" ON "momei_tag" ("slug", "language");
CREATE INDEX "IDX_category_translation_language" ON "momei_category" ("translation_id", "language");
CREATE INDEX "IDX_tag_translation_language" ON "momei_tag" ("translation_id", "language");
