-- 墨梅 (Momei) SQLite 初始化脚本

-- 1. 用户表
CREATE TABLE "momei_user" (
  "id" varchar PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "email" varchar NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT (0),
  "image" varchar,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "role" varchar NOT NULL DEFAULT ('user'),
  "banned" boolean NOT NULL DEFAULT (0),
  "ban_reason" varchar,
  "ban_expires" datetime,
  CONSTRAINT "UQ_email" UNIQUE ("email")
);

-- 2. 账号表
CREATE TABLE "momei_account" (
  "id" varchar PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "account_id" varchar NOT NULL,
  "provider_id" varchar NOT NULL,
  "access_token" varchar,
  "refresh_token" varchar,
  "access_token_expires_at" datetime,
  "refresh_token_expires_at" datetime,
  "scope" varchar,
  "password" varchar,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_account_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 3. 会话表
CREATE TABLE "momei_session" (
  "id" varchar PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "token" varchar NOT NULL,
  "expires_at" datetime NOT NULL,
  "ip_address" varchar,
  "user_agent" varchar,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_token" UNIQUE ("token"),
  CONSTRAINT "FK_session_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 4. 验证码表
CREATE TABLE "momei_verification" (
  "id" varchar PRIMARY KEY NOT NULL,
  "identifier" varchar NOT NULL,
  "value" varchar NOT NULL,
  "expires_at" datetime NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now'))
);

-- 5. 二步验证表
CREATE TABLE "momei_two_factor" (
  "id" varchar PRIMARY KEY NOT NULL,
  "user_id" varchar NOT NULL,
  "secret" varchar NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_two_factor_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 6. JWKS 表
CREATE TABLE "momei_jwks" (
  "id" varchar PRIMARY KEY NOT NULL,
  "public_key" varchar NOT NULL,
  "private_key" varchar NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now'))
);

-- 7. 分类表
CREATE TABLE "momei_category" (
  "id" varchar PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "description" varchar,
  "parent_id" varchar,
  "language" varchar NOT NULL DEFAULT ('zh-CN'),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_category_slug" UNIQUE ("slug"),
  CONSTRAINT "FK_category_parent" FOREIGN KEY ("parent_id") REFERENCES "momei_category" ("id") ON DELETE SET NULL
);

-- 8. 标签表
CREATE TABLE "momei_tag" (
  "id" varchar PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "language" varchar NOT NULL DEFAULT ('zh-CN'),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_tag_slug" UNIQUE ("slug")
);

-- 9. 文章表
CREATE TABLE "momei_post" (
  "id" varchar PRIMARY KEY NOT NULL,
  "title" varchar NOT NULL,
  "slug" varchar NOT NULL,
  "content" text NOT NULL,
  "summary" text,
  "cover_image" varchar,
  "status" varchar NOT NULL DEFAULT ('draft'),
  "language" varchar NOT NULL DEFAULT ('zh-CN'),
  "views" integer NOT NULL DEFAULT (0),
  "published_at" datetime,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "author_id" varchar NOT NULL,
  "category_id" varchar,
  CONSTRAINT "UQ_post_slug" UNIQUE ("slug"),
  CONSTRAINT "FK_post_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id"),
  CONSTRAINT "FK_post_category" FOREIGN KEY ("category_id") REFERENCES "momei_category" ("id") ON DELETE SET NULL
);

-- 10. 文章-标签中间表
CREATE TABLE "momei_post_tags_momei_tag" (
  "momei_post_id" varchar NOT NULL,
  "momei_tag_id" varchar NOT NULL,
  PRIMARY KEY ("momei_post_id", "momei_tag_id"),
  CONSTRAINT "FK_post_tags_post" FOREIGN KEY ("momei_post_id") REFERENCES "momei_post" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_post_tags_tag" FOREIGN KEY ("momei_tag_id") REFERENCES "momei_tag" ("id") ON DELETE CASCADE
);

-- 11. API Key 表
CREATE TABLE "momei_api_key" (
  "id" varchar PRIMARY KEY NOT NULL,
  "name" varchar NOT NULL,
  "key" varchar NOT NULL,
  "prefix" varchar NOT NULL,
  "last_used_at" datetime,
  "expires_at" datetime,
  "user_id" varchar NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_api_key_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 12. 订阅者表
CREATE TABLE "momei_subscriber" (
  "id" varchar PRIMARY KEY NOT NULL,
  "email" varchar NOT NULL,
  "is_active" boolean NOT NULL DEFAULT (1),
  "language" varchar NOT NULL DEFAULT ('zh-CN'),
  "user_id" varchar,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_subscriber_email" UNIQUE ("email"),
  CONSTRAINT "FK_subscriber_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE SET NULL
);

-- 索引
CREATE INDEX "IDX_post_author" ON "momei_post" ("author_id");
CREATE INDEX "IDX_post_category" ON "momei_post" ("category_id");
CREATE INDEX "IDX_api_key_user" ON "momei_api_key" ("user_id");
CREATE INDEX "IDX_subscriber_user" ON "momei_subscriber" ("user_id");

