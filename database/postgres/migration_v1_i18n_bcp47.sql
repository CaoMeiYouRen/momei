-- 迁移脚本：将语言标识符从简写（zh, en）转换为标准 BCP 47 格式（zh-CN, en-US）
-- 适用数据库：PostgreSQL

-- 1. 更新文章表 (momei_post)
UPDATE "momei_post" SET "language" = 'zh-CN' WHERE "language" = 'zh';
UPDATE "momei_post" SET "language" = 'en-US' WHERE "language" = 'en';
ALTER TABLE "momei_post" ALTER COLUMN "language" SET DEFAULT 'zh-CN';

-- 2. 更新分类表 (momei_category)
UPDATE "momei_category" SET "language" = 'zh-CN' WHERE "language" = 'zh';
UPDATE "momei_category" SET "language" = 'en-US' WHERE "language" = 'en';
ALTER TABLE "momei_category" ALTER COLUMN "language" SET DEFAULT 'zh-CN';

-- 3. 更新标签表 (momei_tag)
UPDATE "momei_tag" SET "language" = 'zh-CN' WHERE "language" = 'zh';
UPDATE "momei_tag" SET "language" = 'en-US' WHERE "language" = 'en';
ALTER TABLE "momei_tag" ALTER COLUMN "language" SET DEFAULT 'zh-CN';

-- 4. 更新订阅者表 (momei_subscriber)
-- 注意：如果表尚未创建，此部分可能会报错。在使用 TypeORM 自动同步的环境下，表名通常带有项目前缀。
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'momei_subscriber') THEN
        UPDATE "momei_subscriber" SET "language" = 'zh-CN' WHERE "language" = 'zh';
        UPDATE "momei_subscriber" SET "language" = 'en-US' WHERE "language" = 'en';
        ALTER TABLE "momei_subscriber" ALTER COLUMN "language" SET DEFAULT 'zh-CN';
    END IF;
END $$;
