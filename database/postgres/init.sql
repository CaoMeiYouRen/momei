-- 墨梅博客 PostgreSQL 初始化脚本（基于当前 server/entities）

-- 1. 用户表
CREATE TABLE "momei_user" (
  "id" varchar(36) NOT NULL,
  "name" text NOT NULL,
  "email" varchar(255) NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "username" varchar(128),
  "display_username" varchar(128),
  "is_anonymous" boolean NOT NULL DEFAULT false,
  "phone_number" varchar(64),
  "phone_number_verified" boolean NOT NULL DEFAULT false,
  "role" varchar(128) DEFAULT 'user',
  "banned" boolean NOT NULL DEFAULT false,
  "ban_reason" text,
  "ban_expires" integer,
  "language" varchar(16),
  "timezone" varchar(64),
  "social_links" text,
  "donation_links" text,
  "two_factor_enabled" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_user_email" UNIQUE ("email"),
  CONSTRAINT "UQ_user_username" UNIQUE ("username"),
  CONSTRAINT "UQ_user_phone_number" UNIQUE ("phone_number"),
  PRIMARY KEY ("id")
);

-- 2. 分类表
CREATE TABLE "momei_category" (
  "id" varchar(36) NOT NULL,
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "description" text,
  "parent_id" varchar(36),
  "language" varchar(10) NOT NULL DEFAULT 'zh-CN',
  "translation_id" varchar(255),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_category_slug_language" UNIQUE ("slug", "language"),
  CONSTRAINT "UQ_category_name_language" UNIQUE ("name", "language"),
  CONSTRAINT "UQ_category_translation_language" UNIQUE ("translation_id", "language"),
  CONSTRAINT "FK_category_parent" FOREIGN KEY ("parent_id") REFERENCES "momei_category" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- 3. 标签表
CREATE TABLE "momei_tag" (
  "id" varchar(36) NOT NULL,
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "language" varchar(10) NOT NULL DEFAULT 'zh-CN',
  "translation_id" varchar(255),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_tag_slug_language" UNIQUE ("slug", "language"),
  CONSTRAINT "UQ_tag_name_language" UNIQUE ("name", "language"),
  CONSTRAINT "UQ_tag_translation_language" UNIQUE ("translation_id", "language"),
  PRIMARY KEY ("id")
);

-- 4. 文章表
CREATE TABLE "momei_post" (
  "id" varchar(36) NOT NULL,
  "title" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "summary" text,
  "cover_image" text,
  "language" varchar(10) NOT NULL DEFAULT 'zh-CN',
  "translation_id" varchar(255),
  "author_id" varchar(36) NOT NULL,
  "category_id" varchar(36),
  "status" varchar(20) NOT NULL DEFAULT 'draft',
  "visibility" varchar(20) NOT NULL DEFAULT 'public',
  "password" varchar(255),
  "views" integer NOT NULL DEFAULT 0,
  "is_pinned" boolean NOT NULL DEFAULT false,
  "copyright" text,
  "meta_version" integer NOT NULL DEFAULT 1,
  "metadata" json,
  "published_at" timestamptz(6),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_post_slug_language" UNIQUE ("slug", "language"),
  CONSTRAINT "FK_post_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_post_category" FOREIGN KEY ("category_id") REFERENCES "momei_category" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "momei_post_view_hourly" (
  "id" varchar(36) NOT NULL,
  "post_id" varchar(36) NOT NULL,
  "bucket_hour_utc" timestamptz(6) NOT NULL,
  "views" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_post_view_hourly_post" FOREIGN KEY ("post_id") REFERENCES "momei_post" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
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

-- 7. 账号表
CREATE TABLE "momei_account" (
  "id" varchar(36) NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamptz(6),
  "refresh_token_expires_at" timestamptz(6),
  "scope" text,
  "password" text,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_account_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 8. 会话表
CREATE TABLE "momei_session" (
  "id" varchar(36) NOT NULL,
  "expires_at" timestamptz(6) NOT NULL,
  "token" text NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "user_id" varchar(36) NOT NULL,
  "impersonated_by" varchar(36),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_session_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 9. 验证码表
CREATE TABLE "momei_verification" (
  "id" varchar(36) NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamptz(6) NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- 10. 二步验证表
CREATE TABLE "momei_two_factor" (
  "id" varchar(36) NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "secret" text NOT NULL,
  "backup_codes" text,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_two_factor_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 11. JWKS 表
CREATE TABLE "momei_jwks" (
  "id" varchar(36) NOT NULL,
  "public_key" text NOT NULL,
  "private_key" text NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- 12. API Key 表
CREATE TABLE "momei_api_key" (
  "id" varchar(36) NOT NULL,
  "name" varchar(255) NOT NULL,
  "key" text NOT NULL,
  "prefix" varchar(16) NOT NULL,
  "last_used_at" timestamptz(6),
  "expires_at" timestamptz(6),
  "user_id" varchar(36) NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_api_key_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 13. 订阅者表
CREATE TABLE "momei_subscriber" (
  "id" varchar(36) NOT NULL,
  "email" varchar(255) NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "language" varchar(10) NOT NULL DEFAULT 'zh-CN',
  "subscribed_category_ids" text,
  "subscribed_tag_ids" text,
  "is_marketing_enabled" boolean NOT NULL DEFAULT true,
  "user_id" varchar(36),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_subscriber_email" UNIQUE ("email"),
  CONSTRAINT "FK_subscriber_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- 14. 系统设置表
CREATE TABLE "momei_setting" (
  "key" varchar(128) NOT NULL,
  "value" text,
  "description" varchar(255),
  "mask_type" varchar(32) NOT NULL DEFAULT 'none',
  "level" integer NOT NULL DEFAULT 2,
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("key")
);

-- 15. 管理员通知设置表
CREATE TABLE "momei_admin_notification_settings" (
  "id" varchar(36) NOT NULL,
  "event" varchar(64) NOT NULL,
  "is_email_enabled" boolean NOT NULL DEFAULT true,
  "is_browser_enabled" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_admin_notification_settings_event" UNIQUE ("event"),
  PRIMARY KEY ("id")
);

-- 16. 用户通知偏好设置表
CREATE TABLE "momei_notification_settings" (
  "id" varchar(36) NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "type" varchar(32) NOT NULL DEFAULT 'system',
  "channel" varchar(32) NOT NULL DEFAULT 'email',
  "is_enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_notification_settings_user_type_channel" UNIQUE ("user_id", "type", "channel"),
  CONSTRAINT "FK_notification_settings_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 17. 站内通知表
CREATE TABLE "momei_in_app_notification" (
  "id" varchar(36) NOT NULL,
  "user_id" varchar(36),
  "type" varchar(32) NOT NULL DEFAULT 'system',
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "link" varchar(255),
  "is_read" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_in_app_notification_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 18. 营销活动表
CREATE TABLE "momei_marketing_campaign" (
  "id" varchar(36) NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "type" varchar(32) NOT NULL DEFAULT 'feature',
  "target_criteria" text,
  "sender_id" varchar(36) NOT NULL,
  "sent_at" timestamptz(6),
  "scheduled_at" timestamptz(6),
  "status" varchar(32) NOT NULL DEFAULT 'draft',
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_marketing_campaign_sender" FOREIGN KEY ("sender_id") REFERENCES "momei_user" ("id"),
  PRIMARY KEY ("id")
);

-- 19. AI 任务表
CREATE TABLE "momei_ai_tasks" (
  "id" varchar(36) NOT NULL,
  "type" varchar(50) NOT NULL,
  "provider" varchar(50),
  "model" varchar(100),
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "payload" text,
  "result" text,
  "error" text,
  "user_id" varchar(36) NOT NULL,
  "post_id" varchar(36),
  "mode" varchar(20),
  "voice" varchar(150),
  "script" text,
  "progress" integer NOT NULL DEFAULT 0,
  "estimated_cost" numeric(10,4) NOT NULL DEFAULT 0,
  "actual_cost" numeric(10,4) NOT NULL DEFAULT 0,
  "audio_duration" integer NOT NULL DEFAULT 0,
  "audio_size" integer NOT NULL DEFAULT 0,
  "text_length" integer NOT NULL DEFAULT 0,
  "language" varchar(20),
  "started_at" timestamptz(6),
  "completed_at" timestamptz(6),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- 21. 协议内容版本表
CREATE TABLE "momei_agreement_content" (
  "id" varchar(36) NOT NULL,
  "type" varchar(32) NOT NULL,
  "language" varchar(16) NOT NULL,
  "is_main_version" boolean NOT NULL DEFAULT false,
  "content" text NOT NULL,
  "version" varchar(32),
  "version_description" text,
  "is_from_env" boolean NOT NULL DEFAULT false,
  "has_user_consent" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- 22. 灵感片段表
CREATE TABLE "momei_snippet" (
  "id" varchar(36) NOT NULL,
  "content" text NOT NULL,
  "media" text,
  "audio_url" text,
  "audio_transcription" text,
  "source" varchar(50) NOT NULL DEFAULT 'web',
  "metadata" text,
  "status" varchar(20) NOT NULL DEFAULT 'inbox',
  "author_id" varchar(36) NOT NULL,
  "post_id" varchar(36),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_snippet_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_snippet_post" FOREIGN KEY ("post_id") REFERENCES "momei_post" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- 23. 投稿表
CREATE TABLE "momei_submission" (
  "id" varchar(36) NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "contributor_name" varchar(100) NOT NULL,
  "contributor_email" varchar(255) NOT NULL,
  "contributor_url" varchar(255),
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "author_id" varchar(36),
  "admin_note" text,
  "ip" varchar(45),
  "user_agent" text,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_submission_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- 24. 文章历史版本表
CREATE TABLE "momei_post_version" (
  "id" varchar(36) NOT NULL,
  "post_id" varchar(36) NOT NULL,
  "sequence" integer,
  "parent_version_id" varchar(36),
  "restored_from_version_id" varchar(36),
  "source" varchar(32) NOT NULL DEFAULT 'edit',
  "commit_summary" varchar(255),
  "changed_fields" json,
  "snapshot_hash" varchar(64),
  "snapshot" json,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "summary" text,
  "author_id" varchar(36) NOT NULL,
  "ip_address" varchar(64),
  "user_agent" varchar(512),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_post_version_post" FOREIGN KEY ("post_id") REFERENCES "momei_post" ("id") ON DELETE CASCADE,
  CONSTRAINT "FK_post_version_author" FOREIGN KEY ("author_id") REFERENCES "momei_user" ("id"),
  PRIMARY KEY ("id")
);

-- 25. 主题配置方案表
CREATE TABLE "momei_theme_config" (
  "id" varchar(36) NOT NULL,
  "name" varchar(128) NOT NULL,
  "description" text,
  "config_data" text NOT NULL,
  "preview_image" text,
  "is_system" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- 26. 广告活动表
CREATE TABLE "momei_ad_campaigns" (
  "id" varchar(36) NOT NULL,
  "name" varchar(255) NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'draft',
  "start_date" timestamptz(6),
  "end_date" timestamptz(6),
  "targeting" text,
  "impressions" integer NOT NULL DEFAULT 0,
  "clicks" integer NOT NULL DEFAULT 0,
  "revenue" numeric(10,2) NOT NULL DEFAULT 0,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- 27. 广告位表
CREATE TABLE "momei_ad_placements" (
  "id" varchar(36) NOT NULL,
  "name" varchar(255) NOT NULL,
  "format" varchar(50) NOT NULL,
  "location" varchar(50) NOT NULL,
  "adapter_id" varchar(50) NOT NULL,
  "metadata" text,
  "enabled" boolean NOT NULL DEFAULT true,
  "targeting" text,
  "priority" integer NOT NULL DEFAULT 0,
  "custom_css" text,
  "campaign_id" varchar(36),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_ad_placements_campaign" FOREIGN KEY ("campaign_id") REFERENCES "momei_ad_campaigns" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- 28. 外链表
CREATE TABLE "momei_external_links" (
  "id" varchar(36) NOT NULL,
  "original_url" text NOT NULL,
  "short_code" varchar(50) NOT NULL,
  "status" varchar(50) NOT NULL DEFAULT 'active',
  "no_follow" boolean NOT NULL DEFAULT false,
  "show_redirect_page" boolean NOT NULL DEFAULT true,
  "click_count" integer NOT NULL DEFAULT 0,
  "metadata" text,
  "created_by_id" varchar(36) NOT NULL,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_external_links_short_code" UNIQUE ("short_code"),
  CONSTRAINT "FK_external_links_created_by" FOREIGN KEY ("created_by_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 29. 联邦密钥表
CREATE TABLE "momei_fed_keys" (
  "id" varchar(36) NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "public_key" text NOT NULL,
  "private_key" text NOT NULL,
  "expires_at" timestamptz(6),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_fed_keys_user_id" UNIQUE ("user_id"),
  CONSTRAINT "FK_fed_keys_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
);

-- 30. 友情链接分类表
CREATE TABLE "momei_friend_link_categories" (
  "id" varchar(36) NOT NULL,
  "name" varchar(100) NOT NULL,
  "slug" varchar(100) NOT NULL,
  "description" text,
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_enabled" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_friend_link_categories_slug" UNIQUE ("slug"),
  PRIMARY KEY ("id")
);

-- 31. 友情链接表
CREATE TABLE "momei_friend_links" (
  "id" varchar(36) NOT NULL,
  "name" varchar(120) NOT NULL,
  "url" varchar(500) NOT NULL,
  "logo" varchar(500),
  "description" text,
  "rss_url" varchar(500),
  "contact_email" varchar(255),
  "category_id" varchar(36),
  "status" varchar(20) NOT NULL DEFAULT 'draft',
  "source" varchar(20) NOT NULL DEFAULT 'manual',
  "is_pinned" boolean NOT NULL DEFAULT false,
  "is_featured" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "health_status" varchar(20) NOT NULL DEFAULT 'unknown',
  "consecutive_failures" integer NOT NULL DEFAULT 0,
  "health_check_cooldown_until" timestamptz(6),
  "last_checked_at" timestamptz(6),
  "last_error_message" text,
  "last_http_status" integer,
  "application_id" varchar(36),
  "created_by_id" varchar(36),
  "updated_by_id" varchar(36),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_friend_links_url" UNIQUE ("url"),
  CONSTRAINT "FK_friend_links_category" FOREIGN KEY ("category_id") REFERENCES "momei_friend_link_categories" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- 32. 友情链接申请表
CREATE TABLE "momei_friend_link_applications" (
  "id" varchar(36) NOT NULL,
  "name" varchar(120) NOT NULL,
  "url" varchar(500) NOT NULL,
  "logo" varchar(500),
  "description" text,
  "category_id" varchar(36),
  "category_suggestion" varchar(100),
  "contact_name" varchar(100),
  "contact_email" varchar(255) NOT NULL,
  "rss_url" varchar(500),
  "reciprocal_url" varchar(500),
  "message" text,
  "status" varchar(20) NOT NULL DEFAULT 'pending',
  "applicant_id" varchar(36),
  "review_note" text,
  "submitted_ip" varchar(45),
  "submitted_user_agent" text,
  "reviewed_by_id" varchar(36),
  "reviewed_at" timestamptz(6),
  "friend_link_id" varchar(36),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_friend_link_applications_applicant" FOREIGN KEY ("applicant_id") REFERENCES "momei_user" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- 33. 链接治理报告表
CREATE TABLE "momei_link_governance_report" (
  "id" varchar(36) NOT NULL,
  "mode" varchar(20) NOT NULL,
  "status" varchar(20) NOT NULL DEFAULT 'completed',
  "requested_by_user_id" varchar(36) NOT NULL,
  "scopes" text NOT NULL,
  "filters" text,
  "options" text,
  "summary" text,
  "statistics" text,
  "items" text,
  "redirect_seeds" text,
  "markdown" text,
  "error" text,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- 34. 通知投递审计表
CREATE TABLE "momei_notification_delivery_logs" (
  "id" varchar(36) NOT NULL,
  "notification_id" varchar(36),
  "user_id" varchar(36),
  "channel" varchar(32) NOT NULL,
  "status" varchar(32) NOT NULL,
  "notification_type" varchar(32) NOT NULL,
  "title" varchar(255) NOT NULL,
  "recipient" varchar(255),
  "target_url" varchar(255),
  "error_message" varchar(512),
  "sent_at" timestamptz(6) NOT NULL,
  "metadata" text,
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);

-- 35. 设置审计日志表
CREATE TABLE "momei_setting_audit_logs" (
  "id" varchar(36) NOT NULL,
  "setting_key" varchar(128) NOT NULL,
  "action" varchar(32) NOT NULL,
  "old_value" text,
  "new_value" text,
  "mask_type" varchar(32) NOT NULL DEFAULT 'none',
  "effective_source" varchar(32) NOT NULL DEFAULT 'db',
  "is_overridden_by_env" boolean NOT NULL DEFAULT false,
  "source" varchar(64) NOT NULL DEFAULT 'admin_ui',
  "reason" varchar(255),
  "ip_address" varchar(64),
  "user_agent" varchar(512),
  "operator_id" varchar(36),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "FK_setting_audit_logs_operator" FOREIGN KEY ("operator_id") REFERENCES "momei_user" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

-- 36. Web Push 订阅表
CREATE TABLE "momei_web_push_subscriptions" (
  "id" varchar(36) NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "endpoint" varchar(2048) NOT NULL,
  "subscription" text NOT NULL,
  "permission" varchar(20),
  "user_agent" varchar(512),
  "locale" varchar(20),
  "created_at" timestamptz(6) NOT NULL DEFAULT now(),
  "updated_at" timestamptz(6) NOT NULL DEFAULT now(),
  CONSTRAINT "UQ_web_push_subscriptions_user_endpoint" UNIQUE ("user_id", "endpoint"),
  CONSTRAINT "FK_web_push_subscriptions_user" FOREIGN KEY ("user_id") REFERENCES "momei_user" ("id") ON DELETE CASCADE,
  PRIMARY KEY ("id")
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
CREATE INDEX "IDX_post_is_pinned" ON "momei_post" ("is_pinned");
CREATE INDEX "IDX_post_published_at" ON "momei_post" ("published_at");
CREATE INDEX "IDX_post_view_hourly_post_id" ON "momei_post_view_hourly" ("post_id");
CREATE INDEX "IDX_post_view_hourly_bucket_hour_utc" ON "momei_post_view_hourly" ("bucket_hour_utc");
CREATE UNIQUE INDEX "IDX_post_view_hourly_post_bucket_hour_utc" ON "momei_post_view_hourly" ("post_id", "bucket_hour_utc");

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

CREATE INDEX "IDX_snippet_source" ON "momei_snippet" ("source");
CREATE INDEX "IDX_snippet_status" ON "momei_snippet" ("status");
CREATE INDEX "IDX_snippet_author_id" ON "momei_snippet" ("author_id");
CREATE INDEX "IDX_snippet_post_id" ON "momei_snippet" ("post_id");

CREATE INDEX "IDX_submission_status" ON "momei_submission" ("status");
CREATE INDEX "IDX_submission_author_id" ON "momei_submission" ("author_id");

CREATE INDEX "IDX_post_version_post_id" ON "momei_post_version" ("post_id");
CREATE INDEX "IDX_post_version_sequence" ON "momei_post_version" ("sequence");
CREATE INDEX "IDX_post_version_parent_version_id" ON "momei_post_version" ("parent_version_id");
CREATE INDEX "IDX_post_version_restored_from_version_id" ON "momei_post_version" ("restored_from_version_id");
CREATE INDEX "IDX_post_version_snapshot_hash" ON "momei_post_version" ("snapshot_hash");
CREATE INDEX "IDX_post_version_author_id" ON "momei_post_version" ("author_id");
CREATE UNIQUE INDEX "IDX_post_version_post_sequence" ON "momei_post_version" ("post_id", "sequence");
CREATE INDEX "IDX_post_version_post_created_at" ON "momei_post_version" ("post_id", "created_at");

CREATE INDEX "IDX_ad_campaigns_status" ON "momei_ad_campaigns" ("status");

CREATE INDEX "IDX_ad_placements_location" ON "momei_ad_placements" ("location");
CREATE INDEX "IDX_ad_placements_adapter_id" ON "momei_ad_placements" ("adapter_id");
CREATE INDEX "IDX_ad_placements_enabled" ON "momei_ad_placements" ("enabled");
CREATE INDEX "IDX_ad_placements_location_enabled" ON "momei_ad_placements" ("location", "enabled");

CREATE INDEX "IDX_external_links_status" ON "momei_external_links" ("status");

CREATE INDEX "IDX_friend_link_categories_is_enabled" ON "momei_friend_link_categories" ("is_enabled");

CREATE INDEX "IDX_friend_links_category_id" ON "momei_friend_links" ("category_id");
CREATE INDEX "IDX_friend_links_status" ON "momei_friend_links" ("status");
CREATE INDEX "IDX_friend_links_is_pinned" ON "momei_friend_links" ("is_pinned");
CREATE INDEX "IDX_friend_links_is_featured" ON "momei_friend_links" ("is_featured");
CREATE INDEX "IDX_friend_links_health_status" ON "momei_friend_links" ("health_status");
CREATE INDEX "IDX_friend_links_application_id" ON "momei_friend_links" ("application_id");
CREATE INDEX "IDX_friend_links_created_by_id" ON "momei_friend_links" ("created_by_id");
CREATE INDEX "IDX_friend_links_updated_by_id" ON "momei_friend_links" ("updated_by_id");

CREATE INDEX "IDX_friend_link_applications_url" ON "momei_friend_link_applications" ("url");
CREATE INDEX "IDX_friend_link_applications_category_id" ON "momei_friend_link_applications" ("category_id");
CREATE INDEX "IDX_friend_link_applications_status" ON "momei_friend_link_applications" ("status");
CREATE INDEX "IDX_friend_link_applications_applicant_id" ON "momei_friend_link_applications" ("applicant_id");
CREATE INDEX "IDX_friend_link_applications_reviewed_by_id" ON "momei_friend_link_applications" ("reviewed_by_id");
CREATE INDEX "IDX_friend_link_applications_friend_link_id" ON "momei_friend_link_applications" ("friend_link_id");

CREATE INDEX "IDX_link_governance_report_mode" ON "momei_link_governance_report" ("mode");
CREATE INDEX "IDX_link_governance_report_status" ON "momei_link_governance_report" ("status");
CREATE INDEX "IDX_link_governance_report_requested_by_user_id" ON "momei_link_governance_report" ("requested_by_user_id");

CREATE INDEX "IDX_notification_delivery_logs_notification_type" ON "momei_notification_delivery_logs" ("notification_type");
CREATE INDEX "IDX_notification_delivery_logs_channel" ON "momei_notification_delivery_logs" ("channel");
CREATE INDEX "IDX_notification_delivery_logs_status" ON "momei_notification_delivery_logs" ("status");
CREATE INDEX "IDX_notification_delivery_logs_sent_at" ON "momei_notification_delivery_logs" ("sent_at");
CREATE INDEX "IDX_notification_delivery_logs_recipient" ON "momei_notification_delivery_logs" ("recipient");

CREATE INDEX "IDX_setting_audit_logs_setting_key" ON "momei_setting_audit_logs" ("setting_key");
CREATE INDEX "IDX_setting_audit_logs_operator_id" ON "momei_setting_audit_logs" ("operator_id");
