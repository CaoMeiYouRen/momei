-- 墨梅 (Momei) 数据库迁移脚本 v4
-- 目标：完善用户表和文章表字段，添加评论表和系统设置表
-- 适用数据库：PostgreSQL

BEGIN;

-- 1. 更新用户表 (momei_user)
-- 添加缺失字段
ALTER TABLE "momei_user" ADD COLUMN IF NOT EXISTS "username" varchar(128);
ALTER TABLE "momei_user" ADD COLUMN IF NOT EXISTS "display_username" varchar(128);
ALTER TABLE "momei_user" ADD COLUMN IF NOT EXISTS "is_anonymous" boolean NOT NULL DEFAULT false;
ALTER TABLE "momei_user" ADD COLUMN IF NOT EXISTS "phone_number" varchar(64);
ALTER TABLE "momei_user" ADD COLUMN IF NOT EXISTS "phone_number_verified" boolean NOT NULL DEFAULT false;
ALTER TABLE "momei_user" ADD COLUMN IF NOT EXISTS "language" varchar(16);
ALTER TABLE "momei_user" ADD COLUMN IF NOT EXISTS "timezone" varchar(64);

-- 添加唯一约束
-- 注意：如果 username 或 phone_number 已经有重复值，添加约束会失败
ALTER TABLE "momei_user" DROP CONSTRAINT IF EXISTS "UQ_user_username";
ALTER TABLE "momei_user" ADD CONSTRAINT "UQ_user_username" UNIQUE ("username");
ALTER TABLE "momei_user" DROP CONSTRAINT IF EXISTS "UQ_user_phone_number";
ALTER TABLE "momei_user" ADD CONSTRAINT "UQ_user_phone_number" UNIQUE ("phone_number");

-- 添加索引
CREATE INDEX IF NOT EXISTS "IDX_user_username" ON "momei_user" ("username");
CREATE INDEX IF NOT EXISTS "IDX_user_phone_number" ON "momei_user" ("phone_number");

-- 2. 更新文章表 (momei_post)
-- 添加缺失字段
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "visibility" varchar(20) NOT NULL DEFAULT 'public';
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "password" varchar(255);

-- 添加索引
CREATE INDEX IF NOT EXISTS "IDX_post_visibility" ON "momei_post" ("visibility");
CREATE INDEX IF NOT EXISTS "IDX_post_status" ON "momei_post" ("status");
CREATE INDEX IF NOT EXISTS "IDX_post_language" ON "momei_post" ("language");
CREATE INDEX IF NOT EXISTS "IDX_post_author" ON "momei_post" ("author_id");
CREATE INDEX IF NOT EXISTS "IDX_post_category" ON "momei_post" ("category_id");

-- 3. 创建评论表 (momei_comment)
CREATE TABLE IF NOT EXISTS "momei_comment" (
  "id" varchar(36) NOT NULL,
  "post_id" varchar(36) NOT NULL,
  "author_id" varchar(36),
  "parent_id" varchar(36),
  "content" text NOT NULL,
  "author_name" varchar(100) NOT NULL,
  "author_email" varchar(255) NOT NULL,
  "author_url" varchar(255),
  "status" varchar(20) NOT NULL DEFAULT 'published',
  "ip" varchar(45),
  "user_agent" text,
  "is_sticked" boolean NOT NULL DEFAULT false,
  "likes" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_comment_post" FOREIGN KEY ("post_id") REFERENCES "momei_post" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_comment_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id") ON DELETE SET NULL,
  CONSTRAINT "FK_comment_parent" FOREIGN KEY ("parent_id") REFERENCES "momei_comment" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 添加评论表索引
CREATE INDEX IF NOT EXISTS "IDX_comment_post" ON "momei_comment" ("post_id");
CREATE INDEX IF NOT EXISTS "IDX_comment_author" ON "momei_comment" ("author_id");
CREATE INDEX IF NOT EXISTS "IDX_comment_parent" ON "momei_comment" ("parent_id");
CREATE INDEX IF NOT EXISTS "IDX_comment_status" ON "momei_comment" ("status");

-- 4. 创建系统设置表 (momei_setting)
CREATE TABLE IF NOT EXISTS "momei_setting" (
  "key" varchar(128) NOT NULL,
  "value" text,
  "description" varchar(255),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("key")
);

COMMIT;
