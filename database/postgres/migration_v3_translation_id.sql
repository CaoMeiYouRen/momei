-- 墨梅 (Momei) 数据库迁移脚本
-- 目标：为分类和标签表添加 translation_id 字段，及对应的唯一约束

BEGIN;

-- 1. 分类 (Category)
-- 添加 translation_id 字段
ALTER TABLE "momei_category" ADD COLUMN IF NOT EXISTS "translation_id" varchar(255);
-- 添加唯一约束 (translation_id, language)
-- 注意：如果表中已有重复数据，添加约束可能会失败。
ALTER TABLE "momei_category" ADD CONSTRAINT "UQ_category_translation_language" UNIQUE ("translation_id", "language");
-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS "IDX_category_translation_language" ON "momei_category" ("translation_id", "language");


-- 2. 标签 (Tag)
-- 添加 translation_id 字段
ALTER TABLE "momei_tag" ADD COLUMN IF NOT EXISTS "translation_id" varchar(255);
-- 添加唯一约束 (translation_id, language)
ALTER TABLE "momei_tag" ADD CONSTRAINT "UQ_tag_translation_language" UNIQUE ("translation_id", "language");
-- 创建索引加速查询
CREATE INDEX IF NOT EXISTS "IDX_tag_translation_language" ON "momei_tag" ("translation_id", "language");

-- 3. 文章 (Post)
-- 修正 translation_id 长度（从 36 扩展到 255 以保持一致性）
ALTER TABLE "momei_post" ALTER COLUMN "translation_id" TYPE varchar(255);

COMMIT;
