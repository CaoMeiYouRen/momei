-- 墨梅 (Momei) 数据库迁移脚本
-- 目标：将文章、分类、标签的 slug 唯一约束改为 (slug, language) 联合唯一

BEGIN;

-- 1. 文章 (Post)
ALTER TABLE "momei_post" DROP CONSTRAINT IF EXISTS "UQ_post_slug";
ALTER TABLE "momei_post" ADD CONSTRAINT "UQ_post_slug_language" UNIQUE ("slug", "language");
CREATE INDEX IF NOT EXISTS "IDX_post_slug_language" ON "momei_post" ("slug", "language");

-- 2. 分类 (Category)
ALTER TABLE "momei_category" DROP CONSTRAINT IF EXISTS "UQ_category_slug";
ALTER TABLE "momei_category" DROP CONSTRAINT IF EXISTS "UQ_category_name";
ALTER TABLE "momei_category" ADD CONSTRAINT "UQ_category_slug_language" UNIQUE ("slug", "language");
ALTER TABLE "momei_category" ADD CONSTRAINT "UQ_category_name_language" UNIQUE ("name", "language");
CREATE INDEX IF NOT EXISTS "IDX_category_slug_language" ON "momei_category" ("slug", "language");
CREATE INDEX IF NOT EXISTS "IDX_category_name_language" ON "momei_category" ("name", "language");

-- 3. 标签 (Tag)
ALTER TABLE "momei_tag" DROP CONSTRAINT IF EXISTS "UQ_tag_slug";
ALTER TABLE "momei_tag" DROP CONSTRAINT IF EXISTS "UQ_tag_name";
ALTER TABLE "momei_tag" ADD CONSTRAINT "UQ_tag_slug_language" UNIQUE ("slug", "language");
ALTER TABLE "momei_tag" ADD CONSTRAINT "UQ_tag_name_language" UNIQUE ("name", "language");
CREATE INDEX IF NOT EXISTS "IDX_tag_slug_language" ON "momei_tag" ("slug", "language");
CREATE INDEX IF NOT EXISTS "IDX_tag_name_language" ON "momei_tag" ("name", "language");

COMMIT;
