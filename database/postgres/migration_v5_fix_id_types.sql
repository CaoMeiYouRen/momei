-- 墨梅 (Momei) 数据库修复脚本 v5
-- 目标：修复 Postgres 中由于 ID 字段被错误识别为 numeric 类型导致的溢出问题
-- 场景：用户使用雪花 ID (十六进制字符串) 时，Postgres 报 value overflows numeric format

BEGIN;

-- 1. 修复中间表 momei_post_tags_tag_posts (由自动生成产生)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'momei_post_tags_tag_posts') THEN
        -- 修改列类型
        ALTER TABLE "momei_post_tags_tag_posts" ALTER COLUMN "post_id" TYPE varchar(36);
        ALTER TABLE "momei_post_tags_tag_posts" ALTER COLUMN "tag_id" TYPE varchar(36);
    END IF;
END $$;

-- 2. 修复主表 (以防万一)
ALTER TABLE "momei_post" ALTER COLUMN "id" TYPE varchar(36);
ALTER TABLE "momei_tag" ALTER COLUMN "id" TYPE varchar(36);
ALTER TABLE "momei_user" ALTER COLUMN "id" TYPE varchar(36);
ALTER TABLE "momei_category" ALTER COLUMN "id" TYPE varchar(36);
ALTER TABLE "momei_comment" ALTER COLUMN "id" TYPE varchar(36);

-- 3. 修复可能由旧版生成的其他 ID 字段 (如外键)
ALTER TABLE "momei_post" ALTER COLUMN "author_id" TYPE varchar(36);
ALTER TABLE "momei_post" ALTER COLUMN "category_id" TYPE varchar(36);
ALTER TABLE "momei_comment" ALTER COLUMN "post_id" TYPE varchar(36);
ALTER TABLE "momei_comment" ALTER COLUMN "author_id" TYPE varchar(36);

COMMIT;
