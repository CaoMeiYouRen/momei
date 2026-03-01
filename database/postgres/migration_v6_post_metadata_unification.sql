-- 墨梅 (Momei) 数据库迁移脚本 v6
-- 目标：执行 Post 元数据统一化的 Phase 3（历史数据回填）
-- 范围：仅 PostgreSQL
-- 特性：可重入、幂等、优先保留已存在 metadata 中的数据

BEGIN;

-- 1) Phase 1 基础列（若缺失则补齐）
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "meta_version" integer;
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "metadata" json;

-- 2) 为兼容不同历史版本，补齐可能缺失的平铺字段（仅用于回填）
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "audio_url" text;
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "audio_duration" integer;
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "audio_size" integer;
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "audio_mime_type" varchar(100);
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "tts_provider" varchar(50);
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "tts_voice" varchar(255);
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "tts_generated_at" timestamptz(6);
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "scaffold_outline" text;
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "scaffold_metadata" json;
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "publish_intent" json;
ALTER TABLE "momei_post" ADD COLUMN IF NOT EXISTS "memos_id" varchar(255);

-- 3) 统一默认版本
UPDATE "momei_post"
SET "meta_version" = 1
WHERE "meta_version" IS NULL;

ALTER TABLE "momei_post" ALTER COLUMN "meta_version" SET DEFAULT 1;
ALTER TABLE "momei_post" ALTER COLUMN "meta_version" SET NOT NULL;

-- 4) 回填 metadata（保留已有 metadata 值，缺失时才使用平铺字段）
WITH src AS (
    SELECT
        p."id",
        COALESCE(p."metadata"::jsonb, '{}'::jsonb) AS md,
        p."audio_url",
        p."audio_duration",
        p."audio_size",
        p."audio_mime_type",
        p."tts_provider",
        p."tts_voice",
        p."tts_generated_at",
        p."scaffold_outline",
        p."scaffold_metadata",
        p."publish_intent",
        p."memos_id"
    FROM "momei_post" p
), normalized AS (
    SELECT
        s."id",
        s.md,
        CASE
            WHEN
                COALESCE(s.md #>> '{audio,url}', s."audio_url") IS NULL
                AND COALESCE(
                    CASE WHEN (s.md #>> '{audio,duration}') ~ '^-?[0-9]+$' THEN (s.md #>> '{audio,duration}')::integer END,
                    s."audio_duration"
                ) IS NULL
                AND COALESCE(
                    CASE WHEN (s.md #>> '{audio,size}') ~ '^-?[0-9]+$' THEN (s.md #>> '{audio,size}')::integer END,
                    s."audio_size"
                ) IS NULL
                AND COALESCE(s.md #>> '{audio,mimeType}', s."audio_mime_type") IS NULL
            THEN NULL
            ELSE jsonb_strip_nulls(
                jsonb_build_object(
                    'url', COALESCE(s.md #>> '{audio,url}', s."audio_url"),
                    'duration', COALESCE(
                        CASE WHEN (s.md #>> '{audio,duration}') ~ '^-?[0-9]+$' THEN (s.md #>> '{audio,duration}')::integer END,
                        s."audio_duration"
                    ),
                    'size', COALESCE(
                        CASE WHEN (s.md #>> '{audio,size}') ~ '^-?[0-9]+$' THEN (s.md #>> '{audio,size}')::integer END,
                        s."audio_size"
                    ),
                    'mimeType', COALESCE(s.md #>> '{audio,mimeType}', s."audio_mime_type")
                )
            )
        END AS audio_obj,

        CASE
            WHEN
                COALESCE(s.md #>> '{tts,provider}', s."tts_provider") IS NULL
                AND COALESCE(s.md #>> '{tts,voice}', s."tts_voice") IS NULL
                AND COALESCE(
                    s.md #>> '{tts,generatedAt}',
                    to_char(s."tts_generated_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                ) IS NULL
            THEN NULL
            ELSE jsonb_strip_nulls(
                jsonb_build_object(
                    'provider', COALESCE(s.md #>> '{tts,provider}', s."tts_provider"),
                    'voice', COALESCE(s.md #>> '{tts,voice}', s."tts_voice"),
                    'generatedAt', COALESCE(
                        s.md #>> '{tts,generatedAt}',
                        to_char(s."tts_generated_at" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
                    )
                )
            )
        END AS tts_obj,

        CASE
            WHEN
                COALESCE(s.md #>> '{scaffold,outline}', s."scaffold_outline") IS NULL
                AND COALESCE(s.md #> '{scaffold,metadata}', s."scaffold_metadata"::jsonb) IS NULL
            THEN NULL
            ELSE jsonb_strip_nulls(
                jsonb_build_object(
                    'outline', COALESCE(s.md #>> '{scaffold,outline}', s."scaffold_outline"),
                    'metadata', COALESCE(s.md #> '{scaffold,metadata}', s."scaffold_metadata"::jsonb)
                )
            )
        END AS scaffold_obj,

        CASE
            WHEN COALESCE(s.md #> '{publish,intent}', s."publish_intent"::jsonb) IS NULL
            THEN NULL
            ELSE jsonb_build_object(
                'intent', COALESCE(s.md #> '{publish,intent}', s."publish_intent"::jsonb)
            )
        END AS publish_obj,

        CASE
            WHEN COALESCE(s.md #>> '{integration,memosId}', s."memos_id") IS NULL
            THEN NULL
            ELSE jsonb_build_object(
                'memosId', COALESCE(s.md #>> '{integration,memosId}', s."memos_id")
            )
        END AS integration_obj
    FROM src s
), merged AS (
    SELECT
        n."id",
        (
            n.md
            || CASE WHEN n.audio_obj IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('audio', n.audio_obj) END
            || CASE WHEN n.tts_obj IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('tts', n.tts_obj) END
            || CASE WHEN n.scaffold_obj IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('scaffold', n.scaffold_obj) END
            || CASE WHEN n.publish_obj IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('publish', n.publish_obj) END
            || CASE WHEN n.integration_obj IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('integration', n.integration_obj) END
        ) AS new_md
    FROM normalized n
)
UPDATE "momei_post" p
SET
    "metadata" = m.new_md::json,
    "meta_version" = 1
FROM merged m
WHERE p."id" = m."id"
  AND (
      p."metadata"::jsonb IS DISTINCT FROM m.new_md
      OR p."meta_version" IS DISTINCT FROM 1
  );

COMMIT;
