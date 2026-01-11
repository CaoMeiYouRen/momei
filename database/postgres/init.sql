-- 墨梅 (Momei) PostgreSQL 初始化脚本

-- 1. 用户表
CREATE TABLE "momei_user" (
  "id" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" varchar(255),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  "role" varchar(255) NOT NULL DEFAULT 'user',
  "banned" boolean NOT NULL DEFAULT false,
  "ban_reason" varchar(255),
  "ban_expires" timestamptz(6),
  CONSTRAINT "UQ_email" UNIQUE ("email"),
  PRIMARY KEY ("id")
);

-- 2. 账号表 (第三方登录/密码)
CREATE TABLE "momei_account" (
  "id" varchar(255) NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "account_id" varchar(255) NOT NULL,
  "provider_id" varchar(255) NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "access_token_expires_at" timestamptz(6),
  "refresh_token_expires_at" timestamptz(6),
  "scope" varchar(255),
  "password" varchar(255),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_account_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 3. 会话表
CREATE TABLE "momei_session" (
  "id" varchar(255) NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "token" varchar(255) NOT NULL,
  "expires_at" timestamptz(6) NOT NULL,
  "ip_address" varchar(255),
  "user_agent" text,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_token" UNIQUE ("token"),
  CONSTRAINT "FK_session_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 4. 验证码表
CREATE TABLE "momei_verification" (
  "id" varchar(255) NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamptz(6) NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- 5. 二步验证表
CREATE TABLE "momei_two_factor" (
  "id" varchar(255) NOT NULL,
  "user_id" varchar(255) NOT NULL,
  "secret" text NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_two_factor_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 6. JWKS 表
CREATE TABLE "momei_jwks" (
  "id" varchar(255) NOT NULL,
  "public_key" text NOT NULL,
  "private_key" text NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- 7. 分类表
CREATE TABLE "momei_category" (
  "id" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "description" text,
  "parent_id" varchar(255),
  "language" varchar(255) NOT NULL DEFAULT 'zh-CN',
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_category_slug" UNIQUE ("slug"),
  CONSTRAINT "FK_category_parent" FOREIGN KEY ("parent_id") REFERENCES "momei_category" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- 8. 标签表
CREATE TABLE "momei_tag" (
  "id" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "language" varchar(255) NOT NULL DEFAULT 'zh-CN',
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_tag_slug" UNIQUE ("slug"),
  PRIMARY KEY ("id")
);

-- 9. 文章表
CREATE TABLE "momei_post" (
  "id" varchar(255) NOT NULL,
  "title" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "summary" text,
  "cover_image" varchar(255),
  "status" varchar(255) NOT NULL DEFAULT 'draft',
  "language" varchar(255) NOT NULL DEFAULT 'zh-CN',
  "translation_id" varchar(36),
  "views" integer NOT NULL DEFAULT 0,
  "copyright" text,
  "published_at" timestamptz(6),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  "author_id" varchar(255) NOT NULL,
  "category_id" varchar(255),
  CONSTRAINT "UQ_post_slug" UNIQUE ("slug"),
  CONSTRAINT "FK_post_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id"),
  CONSTRAINT "FK_post_category" FOREIGN KEY ("category_id") REFERENCES "momei_category" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- 10. 文章-标签中间表
CREATE TABLE "momei_post_tags_momei_tag" (
  "momei_post_id" varchar(255) NOT NULL,
  "momei_tag_id" varchar(255) NOT NULL,
  PRIMARY KEY ("momei_post_id", "momei_tag_id"),
  CONSTRAINT "FK_post_tags_post" FOREIGN KEY ("momei_post_id") REFERENCES "momei_post" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_post_tags_tag" FOREIGN KEY ("momei_tag_id") REFERENCES "momei_tag" ("id") ON DELETE CASCADE
);

-- 11. API Key 表
CREATE TABLE "momei_api_key" (
  "id" varchar(255) NOT NULL,
  "name" varchar(255) NOT NULL,
  "key" text NOT NULL,
  "prefix" varchar(16) NOT NULL,
  "last_used_at" timestamptz(6),
  "expires_at" timestamptz(6),
  "user_id" varchar(255) NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_api_key_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 12. 订阅者表
CREATE TABLE "momei_subscriber" (
  "id" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "language" varchar(255) NOT NULL DEFAULT 'zh-CN',
  "user_id" varchar(255),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_subscriber_email" UNIQUE ("email"),
  CONSTRAINT "FK_subscriber_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- 13. 索引
CREATE INDEX "IDX_post_author" ON "momei_post" ("author_id");
CREATE INDEX "IDX_post_category" ON "momei_post" ("category_id");
CREATE INDEX "IDX_verification_identifier_value" ON "momei_verification" ("identifier", "value");
CREATE INDEX "IDX_api_key_user" ON "momei_api_key" ("user_id");
CREATE INDEX "IDX_subscriber_user" ON "momei_subscriber" ("user_id");

