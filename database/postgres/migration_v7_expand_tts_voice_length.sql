-- 墨梅 (Momei) 数据库迁移脚本 v7
-- 目标：扩展 momei_post.tts_voice 字段长度，避免播客双人音色 ID 超长写入失败
-- 范围：仅 PostgreSQL

BEGIN;

ALTER TABLE "momei_post"
ALTER COLUMN "tts_voice" TYPE varchar(255);

COMMIT;
