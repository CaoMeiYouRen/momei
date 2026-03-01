-- 墨梅 (Momei) SQLite 初始化脚本（基于当前 server/entities）

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
  "role" varchar(128) DEFAULT ('user'),
  "banned" boolean NOT NULL DEFAULT (0),
  "ban_reason" text,
  "ban_expires" integer,
  "language" varchar(16),
  "timezone" varchar(64),
  "social_links" text,
  "donation_links" text,
  "two_factor_enabled" boolean NOT NULL DEFAULT (0),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_user_email" UNIQUE ("email"),
  CONSTRAINT "UQ_user_username" UNIQUE ("username"),
  CONSTRAINT "UQ_user_phone_number" UNIQUE ("phone_number")
);

-- 2. 分类表
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

-- 3. 标签表
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

-- 4. 文章表
CREATE TABLE "momei_post" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "summary" text,
  "cover_image" text,
  "language" varchar(10) NOT NULL DEFAULT ('zh-CN'),
  "translation_id" varchar(255),
  "author_id" varchar(36) NOT NULL,
  "category_id" varchar(36),
  "status" varchar(20) NOT NULL DEFAULT ('draft'),
  "visibility" varchar(20) NOT NULL DEFAULT ('public'),
  "password" varchar(255),
  "views" integer NOT NULL DEFAULT (0),
  "copyright" text,
  "meta_version" integer NOT NULL DEFAULT (1),
  "metadata" text,
  "audio_url" text,
  "audio_duration" integer,
  "audio_size" integer,
  "audio_mime_type" varchar(100),
  "tts_provider" varchar(50),
  "tts_voice" varchar(255),
  "tts_generated_at" datetime,
  "scaffold_outline" text,
  "scaffold_metadata" text,
  "publish_intent" text,
  "published_at" datetime,
  "memos_id" varchar(255),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_post_slug_language" UNIQUE ("slug", "language"),
  CONSTRAINT "FK_post_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_post_category" FOREIGN KEY ("category_id") REFERENCES "momei_category" ("id") ON DELETE SET NULL
);

-- 5. 文章-标签中间表
CREATE TABLE "momei_post_tags_tag_posts" (
  "post_id" varchar(36) NOT NULL,
  "tag_id" varchar(36) NOT NULL,
  PRIMARY KEY ("post_id", "tag_id"),
  CONSTRAINT "FK_post_tags_post" FOREIGN KEY ("post_id") REFERENCES "momei_post" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_post_tags_tag" FOREIGN KEY ("tag_id") REFERENCES "momei_tag" ("id") ON DELETE CASCADE
);

-- 6. 评论表
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

-- 7. 账号表
CREATE TABLE "momei_account" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" datetime,
  "refresh_token_expires_at" datetime,
  "scope" text,
  "password" text,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_account_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 8. 会话表
CREATE TABLE "momei_session" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "expires_at" datetime NOT NULL,
  "token" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" varchar(36) NOT NULL,
  "impersonated_by" varchar(36),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_session_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 9. 验证码表
CREATE TABLE "momei_verification" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" datetime NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now'))
);

-- 10. 二步验证表
CREATE TABLE "momei_two_factor" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "secret" text NOT NULL,
  "backup_codes" text,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_two_factor_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 11. JWKS 表
CREATE TABLE "momei_jwks" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "public_key" text NOT NULL,
  "private_key" text NOT NULL,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now'))
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
  "subscribed_category_ids" text,
  "subscribed_tag_ids" text,
  "is_marketing_enabled" boolean NOT NULL DEFAULT (1),
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
  "mask_type" varchar(32) NOT NULL DEFAULT ('none'),
  "level" integer NOT NULL DEFAULT (2),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now'))
);

-- 15. 管理员通知设置表
CREATE TABLE "momei_admin_notification_settings" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "event" varchar(64) NOT NULL,
  "is_email_enabled" boolean NOT NULL DEFAULT (1),
  "is_browser_enabled" boolean NOT NULL DEFAULT (0),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_admin_notification_settings_event" UNIQUE ("event")
);

-- 16. 用户通知偏好设置表
CREATE TABLE "momei_notification_settings" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "type" varchar(32) NOT NULL DEFAULT ('system'),
  "channel" varchar(32) NOT NULL DEFAULT ('email'),
  "is_enabled" boolean NOT NULL DEFAULT (1),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_notification_settings_user_type_channel" UNIQUE ("user_id", "type", "channel"),
  CONSTRAINT "FK_notification_settings_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 17. 站内通知表
CREATE TABLE "momei_in_app_notification" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36),
  "type" varchar(32) NOT NULL DEFAULT ('system'),
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "link" varchar(255),
  "is_read" boolean NOT NULL DEFAULT (0),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_in_app_notification_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE
);

-- 18. 营销活动表
CREATE TABLE "momei_marketing_campaign" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "type" varchar(32) NOT NULL DEFAULT ('feature'),
  "target_criteria" text,
  "sender_id" varchar(36) NOT NULL,
  "sent_at" datetime,
  "scheduled_at" datetime,
  "status" varchar(32) NOT NULL DEFAULT ('draft'),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_marketing_campaign_sender" FOREIGN KEY ("sender_id") REFERENCES "momei_user" ("id")
);

-- 19. AI 任务表
CREATE TABLE "momei_ai_tasks" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "type" varchar(50) NOT NULL,
  "provider" varchar(50),
  "model" varchar(100),
  "status" varchar(20) NOT NULL DEFAULT ('pending'),
  "payload" text,
  "result" text,
  "error" text,
  "user_id" varchar(36) NOT NULL,
  "post_id" varchar(36),
  "mode" varchar(20),
  "voice" varchar(150),
  "script" text,
  "progress" integer NOT NULL DEFAULT (0),
  "estimated_cost" decimal(10,4) NOT NULL DEFAULT (0),
  "actual_cost" decimal(10,4) NOT NULL DEFAULT (0),
  "audio_duration" integer NOT NULL DEFAULT (0),
  "audio_size" integer NOT NULL DEFAULT (0),
  "text_length" integer NOT NULL DEFAULT (0),
  "language" varchar(20),
  "started_at" datetime,
  "completed_at" datetime,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now'))
);

-- 20. ASR 配额表
CREATE TABLE "momei_asr_quotas" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "provider" varchar(50) NOT NULL,
  "period_type" varchar(20) NOT NULL,
  "used_seconds" integer NOT NULL DEFAULT (0),
  "max_seconds" integer NOT NULL DEFAULT (3600),
  "reset_at" datetime,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "UQ_asr_quotas_user_provider_period" UNIQUE ("user_id", "provider", "period_type")
);

-- 21. 协议内容版本表
CREATE TABLE "momei_agreement_content" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "type" varchar(32) NOT NULL,
  "language" varchar(16) NOT NULL,
  "is_main_version" boolean NOT NULL DEFAULT (0),
  "content" text NOT NULL,
  "version" varchar(32),
  "version_description" text,
  "is_from_env" boolean NOT NULL DEFAULT (0),
  "has_user_consent" boolean NOT NULL DEFAULT (0),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now'))
);

-- 22. 灵感片段表
CREATE TABLE "momei_snippet" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "content" text NOT NULL,
  "media" text,
  "audio_url" text,
  "audio_transcription" text,
  "source" varchar(50) NOT NULL DEFAULT ('web'),
  "metadata" text,
  "status" varchar(20) NOT NULL DEFAULT ('inbox'),
  "author_id" varchar(36) NOT NULL,
  "post_id" varchar(36),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_snippet_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_snippet_post" FOREIGN KEY ("post_id") REFERENCES "momei_post" ("id") ON DELETE SET NULL
);

-- 23. 投稿表
CREATE TABLE "momei_submission" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "contributor_name" varchar(100) NOT NULL,
  "contributor_email" varchar(255) NOT NULL,
  "contributor_url" varchar(255),
  "status" varchar(20) NOT NULL DEFAULT ('pending'),
  "author_id" varchar(36),
  "admin_note" text,
  "ip" varchar(45),
  "user_agent" text,
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_submission_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id") ON DELETE SET NULL
);

-- 24. 文章历史版本表
CREATE TABLE "momei_post_version" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "post_id" varchar(36) NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "summary" text,
  "author_id" varchar(36) NOT NULL,
  "reason" varchar(255),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  CONSTRAINT "FK_post_version_post" FOREIGN KEY ("post_id") REFERENCES "momei_post" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_post_version_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id")
);

-- 25. 主题配置方案表
CREATE TABLE "momei_theme_config" (
  "id" varchar(36) PRIMARY KEY NOT NULL,
  "name" varchar(128) NOT NULL,
  "description" text,
  "config_data" text NOT NULL,
  "preview_image" text,
  "is_system" boolean NOT NULL DEFAULT (0),
  "created_at" datetime NOT NULL DEFAULT (DATETIME('now')),
  "updated_at" datetime NOT NULL DEFAULT (DATETIME('now'))
);

-- 索引
CREATE INDEX "IDX_user_email" ON "momei_user" ("email");
CREATE INDEX "IDX_user_username" ON "momei_user" ("username");
CREATE INDEX "IDX_user_phone_number" ON "momei_user" ("phone_number");

CREATE INDEX "IDX_category_name" ON "momei_category" ("name");
CREATE INDEX "IDX_category_parent_id" ON "momei_category" ("parent_id");
CREATE INDEX "IDX_category_language" ON "momei_category" ("language");
CREATE INDEX "IDX_category_translation_id" ON "momei_category" ("translation_id");

CREATE INDEX "IDX_tag_name" ON "momei_tag" ("name");
CREATE INDEX "IDX_tag_language" ON "momei_tag" ("language");
CREATE INDEX "IDX_tag_translation_id" ON "momei_tag" ("translation_id");

CREATE INDEX "IDX_post_title" ON "momei_post" ("title");
CREATE INDEX "IDX_post_language" ON "momei_post" ("language");
CREATE INDEX "IDX_post_translation_id" ON "momei_post" ("translation_id");
CREATE INDEX "IDX_post_author_id" ON "momei_post" ("author_id");
CREATE INDEX "IDX_post_category_id" ON "momei_post" ("category_id");
CREATE INDEX "IDX_post_status" ON "momei_post" ("status");
CREATE INDEX "IDX_post_visibility" ON "momei_post" ("visibility");
CREATE INDEX "IDX_post_views" ON "momei_post" ("views");
CREATE INDEX "IDX_post_published_at" ON "momei_post" ("published_at");
CREATE INDEX "IDX_post_memos_id" ON "momei_post" ("memos_id");

CREATE INDEX "IDX_comment_post_id" ON "momei_comment" ("post_id");
CREATE INDEX "IDX_comment_author_id" ON "momei_comment" ("author_id");
CREATE INDEX "IDX_comment_parent_id" ON "momei_comment" ("parent_id");
CREATE INDEX "IDX_comment_status" ON "momei_comment" ("status");

CREATE INDEX "IDX_account_user_id" ON "momei_account" ("user_id");
CREATE INDEX "IDX_session_token" ON "momei_session" ("token");
CREATE INDEX "IDX_session_user_id" ON "momei_session" ("user_id");
CREATE INDEX "IDX_verification_identifier" ON "momei_verification" ("identifier");
CREATE INDEX "IDX_verification_identifier_value" ON "momei_verification" ("identifier", "value");
CREATE INDEX "IDX_two_factor_user_id" ON "momei_two_factor" ("user_id");
CREATE INDEX "IDX_api_key_user_id" ON "momei_api_key" ("user_id");
CREATE INDEX "IDX_subscriber_user_id" ON "momei_subscriber" ("user_id");

CREATE INDEX "IDX_in_app_notification_user_read" ON "momei_in_app_notification" ("user_id", "is_read");
CREATE INDEX "IDX_in_app_notification_created_at" ON "momei_in_app_notification" ("created_at");

CREATE INDEX "IDX_marketing_campaign_scheduled_at" ON "momei_marketing_campaign" ("scheduled_at");
CREATE INDEX "IDX_marketing_campaign_status" ON "momei_marketing_campaign" ("status");

CREATE INDEX "IDX_asr_quotas_user_id" ON "momei_asr_quotas" ("user_id");

CREATE INDEX "IDX_snippet_source" ON "momei_snippet" ("source");
CREATE INDEX "IDX_snippet_status" ON "momei_snippet" ("status");
CREATE INDEX "IDX_snippet_author_id" ON "momei_snippet" ("author_id");
CREATE INDEX "IDX_snippet_post_id" ON "momei_snippet" ("post_id");

CREATE INDEX "IDX_submission_status" ON "momei_submission" ("status");
CREATE INDEX "IDX_submission_author_id" ON "momei_submission" ("author_id");

CREATE INDEX "IDX_post_version_post_id" ON "momei_post_version" ("post_id");
CREATE INDEX "IDX_post_version_author_id" ON "momei_post_version" ("author_id");
