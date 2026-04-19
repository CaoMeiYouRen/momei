-- 墨梅博客 MySQL 初始化脚本（基于当前 server/entities）

-- 1. 用户表
CREATE TABLE `momei_user` (
  `id` varchar(36) NOT NULL,
  `name` text NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `image` text DEFAULT NULL,
  `username` varchar(128) DEFAULT NULL,
  `display_username` varchar(128) DEFAULT NULL,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `phone_number` varchar(64) DEFAULT NULL,
  `phone_number_verified` tinyint(1) NOT NULL DEFAULT 0,
  `role` varchar(128) DEFAULT 'user',
  `banned` tinyint(1) NOT NULL DEFAULT 0,
  `ban_reason` text DEFAULT NULL,
  `ban_expires` int DEFAULT NULL,
  `language` varchar(16) DEFAULT NULL,
  `timezone` varchar(64) DEFAULT NULL,
  `social_links` text DEFAULT NULL,
  `donation_links` text DEFAULT NULL,
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_user_email` (`email`),
  UNIQUE KEY `UQ_user_username` (`username`),
  UNIQUE KEY `UQ_user_phone_number` (`phone_number`),
  KEY `IDX_user_email` (`email`),
  KEY `IDX_user_username` (`username`),
  KEY `IDX_user_phone_number` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. 分类表
CREATE TABLE `momei_category` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `language` varchar(10) NOT NULL DEFAULT 'zh-CN',
  `translation_id` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_category_slug_language` (`slug`, `language`),
  UNIQUE KEY `UQ_category_name_language` (`name`, `language`),
  UNIQUE KEY `UQ_category_translation_language` (`translation_id`, `language`),
  KEY `IDX_category_name` (`name`),
  KEY `IDX_category_parent_id` (`parent_id`),
  KEY `IDX_category_language` (`language`),
  KEY `IDX_category_translation_id` (`translation_id`),
  CONSTRAINT `FK_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `momei_category` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. 标签表
CREATE TABLE `momei_tag` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `language` varchar(10) NOT NULL DEFAULT 'zh-CN',
  `translation_id` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_tag_slug_language` (`slug`, `language`),
  UNIQUE KEY `UQ_tag_name_language` (`name`, `language`),
  UNIQUE KEY `UQ_tag_translation_language` (`translation_id`, `language`),
  KEY `IDX_tag_name` (`name`),
  KEY `IDX_tag_language` (`language`),
  KEY `IDX_tag_translation_id` (`translation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. 文章表
CREATE TABLE `momei_post` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `summary` text DEFAULT NULL,
  `cover_image` text DEFAULT NULL,
  `language` varchar(10) NOT NULL DEFAULT 'zh-CN',
  `translation_id` varchar(255) DEFAULT NULL,
  `author_id` varchar(36) NOT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `visibility` varchar(20) NOT NULL DEFAULT 'public',
  `password` varchar(255) DEFAULT NULL,
  `views` int NOT NULL DEFAULT 0,
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `copyright` text DEFAULT NULL,
  `meta_version` int NOT NULL DEFAULT 1,
  `metadata` json DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_post_slug_language` (`slug`, `language`),
  KEY `IDX_post_title` (`title`),
  KEY `IDX_post_language` (`language`),
  KEY `IDX_post_translation_id` (`translation_id`),
  KEY `IDX_post_author_id` (`author_id`),
  KEY `IDX_post_category_id` (`category_id`),
  KEY `IDX_post_status` (`status`),
  KEY `IDX_post_visibility` (`visibility`),
  KEY `IDX_post_views` (`views`),
  KEY `IDX_post_is_pinned` (`is_pinned`),
  KEY `IDX_post_published_at` (`published_at`),
  CONSTRAINT `FK_post_author` FOREIGN KEY (`author_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_post_category` FOREIGN KEY (`category_id`) REFERENCES `momei_category` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `momei_post_view_hourly` (
  `id` varchar(36) NOT NULL,
  `post_id` varchar(36) NOT NULL,
  `bucket_hour_utc` datetime(6) NOT NULL,
  `views` int NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_post_view_hourly_post_id` (`post_id`),
  KEY `IDX_post_view_hourly_bucket_hour_utc` (`bucket_hour_utc`),
  UNIQUE KEY `IDX_post_view_hourly_post_bucket_hour_utc` (`post_id`, `bucket_hour_utc`),
  CONSTRAINT `FK_post_view_hourly_post` FOREIGN KEY (`post_id`) REFERENCES `momei_post` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. 文章-标签中间表
CREATE TABLE `momei_post_tags_tag_posts` (
  `post_id` varchar(36) NOT NULL,
  `tag_id` varchar(36) NOT NULL,
  PRIMARY KEY (`post_id`, `tag_id`),
  KEY `IDX_post_tags_post_id` (`post_id`),
  KEY `IDX_post_tags_tag_id` (`tag_id`),
  CONSTRAINT `FK_post_tags_post` FOREIGN KEY (`post_id`) REFERENCES `momei_post` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_post_tags_tag` FOREIGN KEY (`tag_id`) REFERENCES `momei_tag` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. 评论表
CREATE TABLE `momei_comment` (
  `id` varchar(36) NOT NULL,
  `post_id` varchar(36) NOT NULL,
  `author_id` varchar(36) DEFAULT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `content` text NOT NULL,
  `author_name` varchar(100) NOT NULL,
  `author_email` varchar(255) NOT NULL,
  `author_url` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'published',
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `is_sticked` tinyint(1) NOT NULL DEFAULT 0,
  `likes` int NOT NULL DEFAULT 0,
  `translation_cache` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_comment_post_id` (`post_id`),
  KEY `IDX_comment_author_id` (`author_id`),
  KEY `IDX_comment_parent_id` (`parent_id`),
  KEY `IDX_comment_status` (`status`),
  CONSTRAINT `FK_comment_post` FOREIGN KEY (`post_id`) REFERENCES `momei_post` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_comment_author` FOREIGN KEY (`author_id`) REFERENCES `momei_user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_comment_parent` FOREIGN KEY (`parent_id`) REFERENCES `momei_comment` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. 账号表
CREATE TABLE `momei_account` (
  `id` varchar(36) NOT NULL,
  `account_id` text NOT NULL,
  `provider_id` text NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `access_token` text DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `id_token` text DEFAULT NULL,
  `access_token_expires_at` datetime(6) DEFAULT NULL,
  `refresh_token_expires_at` datetime(6) DEFAULT NULL,
  `scope` text DEFAULT NULL,
  `password` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_account_user_id` (`user_id`),
  CONSTRAINT `FK_account_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. 会话表
CREATE TABLE `momei_session` (
  `id` varchar(36) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `token` text NOT NULL,
  `ip_address` text DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `user_id` varchar(36) NOT NULL,
  `impersonated_by` varchar(36) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_session_token` (`token`(255)),
  KEY `IDX_session_user_id` (`user_id`),
  CONSTRAINT `FK_session_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 9. 验证码表
CREATE TABLE `momei_verification` (
  `id` varchar(36) NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_verification_identifier` (`identifier`(255)),
  KEY `IDX_verification_identifier_value` (`identifier`(255), `value`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 10. 二步验证表
CREATE TABLE `momei_two_factor` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `secret` text NOT NULL,
  `backup_codes` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_two_factor_user_id` (`user_id`),
  CONSTRAINT `FK_two_factor_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 11. JWKS 表
CREATE TABLE `momei_jwks` (
  `id` varchar(36) NOT NULL,
  `public_key` text NOT NULL,
  `private_key` text NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 12. API Key 表
CREATE TABLE `momei_api_key` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `key` text NOT NULL,
  `prefix` varchar(16) NOT NULL,
  `last_used_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  `user_id` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_api_key_user_id` (`user_id`),
  CONSTRAINT `FK_api_key_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 13. 订阅者表
CREATE TABLE `momei_subscriber` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `language` varchar(10) NOT NULL DEFAULT 'zh-CN',
  `subscribed_category_ids` text DEFAULT NULL,
  `subscribed_tag_ids` text DEFAULT NULL,
  `is_marketing_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `user_id` varchar(36) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_subscriber_email` (`email`),
  KEY `IDX_subscriber_user_id` (`user_id`),
  CONSTRAINT `FK_subscriber_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 14. 系统设置表
CREATE TABLE `momei_setting` (
  `key` varchar(128) NOT NULL,
  `value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `mask_type` varchar(32) NOT NULL DEFAULT 'none',
  `level` int NOT NULL DEFAULT 2,
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 15. 管理员通知设置表
CREATE TABLE `momei_admin_notification_settings` (
  `id` varchar(36) NOT NULL,
  `event` varchar(64) NOT NULL,
  `is_email_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `is_browser_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_admin_notification_settings_event` (`event`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 16. 用户通知偏好设置表
CREATE TABLE `momei_notification_settings` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` varchar(32) NOT NULL DEFAULT 'system',
  `channel` varchar(32) NOT NULL DEFAULT 'email',
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_notification_settings_user_type_channel` (`user_id`, `type`, `channel`),
  CONSTRAINT `FK_notification_settings_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 17. 站内通知表
CREATE TABLE `momei_in_app_notification` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `type` varchar(32) NOT NULL DEFAULT 'system',
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `link` varchar(255) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_in_app_notification_user_read` (`user_id`, `is_read`),
  KEY `IDX_in_app_notification_created_at` (`created_at`),
  CONSTRAINT `FK_in_app_notification_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 18. 营销活动表
CREATE TABLE `momei_marketing_campaign` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(32) NOT NULL DEFAULT 'feature',
  `target_criteria` text DEFAULT NULL,
  `sender_id` varchar(36) NOT NULL,
  `sent_at` datetime(6) DEFAULT NULL,
  `scheduled_at` datetime(6) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'draft',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_marketing_campaign_scheduled_at` (`scheduled_at`),
  KEY `IDX_marketing_campaign_status` (`status`),
  CONSTRAINT `FK_marketing_campaign_sender` FOREIGN KEY (`sender_id`) REFERENCES `momei_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 19. AI 任务表
CREATE TABLE `momei_ai_tasks` (
  `id` varchar(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `provider` varchar(50) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `payload` text DEFAULT NULL,
  `result` text DEFAULT NULL,
  `error` text DEFAULT NULL,
  `user_id` varchar(36) NOT NULL,
  `post_id` varchar(36) DEFAULT NULL,
  `mode` varchar(20) DEFAULT NULL,
  `voice` varchar(150) DEFAULT NULL,
  `script` text DEFAULT NULL,
  `progress` int NOT NULL DEFAULT 0,
  `estimated_cost` decimal(10,4) NOT NULL DEFAULT 0,
  `actual_cost` decimal(10,4) NOT NULL DEFAULT 0,
  `audio_duration` int NOT NULL DEFAULT 0,
  `audio_size` int NOT NULL DEFAULT 0,
  `text_length` int NOT NULL DEFAULT 0,
  `language` varchar(20) DEFAULT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 21. 协议内容版本表
CREATE TABLE `momei_agreement_content` (
  `id` varchar(36) NOT NULL,
  `type` varchar(32) NOT NULL,
  `language` varchar(16) NOT NULL,
  `is_main_version` tinyint(1) NOT NULL DEFAULT 0,
  `content` longtext NOT NULL,
  `version` varchar(32) DEFAULT NULL,
  `version_description` text DEFAULT NULL,
  `is_from_env` tinyint(1) NOT NULL DEFAULT 0,
  `has_user_consent` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 22. 灵感片段表
CREATE TABLE `momei_snippet` (
  `id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `media` text DEFAULT NULL,
  `audio_url` text DEFAULT NULL,
  `audio_transcription` text DEFAULT NULL,
  `source` varchar(50) NOT NULL DEFAULT 'web',
  `metadata` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'inbox',
  `author_id` varchar(36) NOT NULL,
  `post_id` varchar(36) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_snippet_source` (`source`),
  KEY `IDX_snippet_status` (`status`),
  KEY `IDX_snippet_author_id` (`author_id`),
  KEY `IDX_snippet_post_id` (`post_id`),
  CONSTRAINT `FK_snippet_author` FOREIGN KEY (`author_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_snippet_post` FOREIGN KEY (`post_id`) REFERENCES `momei_post` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 23. 投稿表
CREATE TABLE `momei_submission` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `contributor_name` varchar(100) NOT NULL,
  `contributor_email` varchar(255) NOT NULL,
  `contributor_url` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `author_id` varchar(36) DEFAULT NULL,
  `admin_note` text DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_submission_status` (`status`),
  KEY `IDX_submission_author_id` (`author_id`),
  CONSTRAINT `FK_submission_author` FOREIGN KEY (`author_id`) REFERENCES `momei_user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 24. 文章历史版本表
CREATE TABLE `momei_post_version` (
  `id` varchar(36) NOT NULL,
  `post_id` varchar(36) NOT NULL,
  `sequence` int DEFAULT NULL,
  `parent_version_id` varchar(36) DEFAULT NULL,
  `restored_from_version_id` varchar(36) DEFAULT NULL,
  `source` varchar(32) NOT NULL DEFAULT 'edit',
  `commit_summary` varchar(255) DEFAULT NULL,
  `changed_fields` json DEFAULT NULL,
  `snapshot_hash` varchar(64) DEFAULT NULL,
  `snapshot` json DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `summary` text DEFAULT NULL,
  `author_id` varchar(36) NOT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_post_version_post_id` (`post_id`),
  KEY `IDX_post_version_sequence` (`sequence`),
  KEY `IDX_post_version_parent_version_id` (`parent_version_id`),
  KEY `IDX_post_version_restored_from_version_id` (`restored_from_version_id`),
  KEY `IDX_post_version_snapshot_hash` (`snapshot_hash`),
  KEY `IDX_post_version_author_id` (`author_id`),
  UNIQUE KEY `IDX_post_version_post_sequence` (`post_id`, `sequence`),
  KEY `IDX_post_version_post_created_at` (`post_id`, `created_at`),
  CONSTRAINT `FK_post_version_post` FOREIGN KEY (`post_id`) REFERENCES `momei_post` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_post_version_author` FOREIGN KEY (`author_id`) REFERENCES `momei_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 25. 主题配置方案表
CREATE TABLE `momei_theme_config` (
  `id` varchar(36) NOT NULL,
  `name` varchar(128) NOT NULL,
  `description` text DEFAULT NULL,
  `config_data` text NOT NULL,
  `preview_image` mediumtext DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 26. 广告活动表
CREATE TABLE `momei_ad_campaigns` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `start_date` datetime(6) DEFAULT NULL,
  `end_date` datetime(6) DEFAULT NULL,
  `targeting` text DEFAULT NULL,
  `impressions` int NOT NULL DEFAULT 0,
  `clicks` int NOT NULL DEFAULT 0,
  `revenue` decimal(10,2) NOT NULL DEFAULT 0,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_ad_campaigns_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 27. 广告位表
CREATE TABLE `momei_ad_placements` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `format` varchar(50) NOT NULL,
  `location` varchar(50) NOT NULL,
  `adapter_id` varchar(50) NOT NULL,
  `metadata` text DEFAULT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `targeting` text DEFAULT NULL,
  `priority` int NOT NULL DEFAULT 0,
  `custom_css` text DEFAULT NULL,
  `campaign_id` varchar(36) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_ad_placements_location` (`location`),
  KEY `IDX_ad_placements_adapter_id` (`adapter_id`),
  KEY `IDX_ad_placements_enabled` (`enabled`),
  KEY `IDX_ad_placements_location_enabled` (`location`, `enabled`),
  CONSTRAINT `FK_ad_placements_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `momei_ad_campaigns` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 28. 外链表
CREATE TABLE `momei_external_links` (
  `id` varchar(36) NOT NULL,
  `original_url` text NOT NULL,
  `short_code` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `no_follow` tinyint(1) NOT NULL DEFAULT 0,
  `show_redirect_page` tinyint(1) NOT NULL DEFAULT 1,
  `click_count` int NOT NULL DEFAULT 0,
  `metadata` text DEFAULT NULL,
  `created_by_id` varchar(36) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_external_links_short_code` (`short_code`),
  KEY `IDX_external_links_status` (`status`),
  CONSTRAINT `FK_external_links_created_by` FOREIGN KEY (`created_by_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 29. 联邦密钥表
CREATE TABLE `momei_fed_keys` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `public_key` text NOT NULL,
  `private_key` text NOT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_fed_keys_user_id` (`user_id`),
  CONSTRAINT `FK_fed_keys_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 30. 友情链接分类表
CREATE TABLE `momei_friend_link_categories` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_friend_link_categories_slug` (`slug`),
  KEY `IDX_friend_link_categories_is_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 31. 友情链接表
CREATE TABLE `momei_friend_links` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `url` varchar(500) NOT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `rss_url` varchar(500) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `source` varchar(20) NOT NULL DEFAULT 'manual',
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int NOT NULL DEFAULT 0,
  `health_status` varchar(20) NOT NULL DEFAULT 'unknown',
  `consecutive_failures` int NOT NULL DEFAULT 0,
  `health_check_cooldown_until` datetime(6) DEFAULT NULL,
  `last_checked_at` datetime(6) DEFAULT NULL,
  `last_error_message` text DEFAULT NULL,
  `last_http_status` int DEFAULT NULL,
  `application_id` varchar(36) DEFAULT NULL,
  `created_by_id` varchar(36) DEFAULT NULL,
  `updated_by_id` varchar(36) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_friend_links_url` (`url`),
  KEY `IDX_friend_links_category_id` (`category_id`),
  KEY `IDX_friend_links_status` (`status`),
  KEY `IDX_friend_links_is_pinned` (`is_pinned`),
  KEY `IDX_friend_links_is_featured` (`is_featured`),
  KEY `IDX_friend_links_health_status` (`health_status`),
  KEY `IDX_friend_links_application_id` (`application_id`),
  KEY `IDX_friend_links_created_by_id` (`created_by_id`),
  KEY `IDX_friend_links_updated_by_id` (`updated_by_id`),
  CONSTRAINT `FK_friend_links_category` FOREIGN KEY (`category_id`) REFERENCES `momei_friend_link_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 32. 友情链接申请表
CREATE TABLE `momei_friend_link_applications` (
  `id` varchar(36) NOT NULL,
  `name` varchar(120) NOT NULL,
  `url` varchar(500) NOT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  `category_suggestion` varchar(100) DEFAULT NULL,
  `contact_name` varchar(100) DEFAULT NULL,
  `contact_email` varchar(255) NOT NULL,
  `rss_url` varchar(500) DEFAULT NULL,
  `reciprocal_url` varchar(500) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `applicant_id` varchar(36) DEFAULT NULL,
  `review_note` text DEFAULT NULL,
  `submitted_ip` varchar(45) DEFAULT NULL,
  `submitted_user_agent` text DEFAULT NULL,
  `reviewed_by_id` varchar(36) DEFAULT NULL,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `friend_link_id` varchar(36) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_friend_link_applications_url` (`url`),
  KEY `IDX_friend_link_applications_category_id` (`category_id`),
  KEY `IDX_friend_link_applications_status` (`status`),
  KEY `IDX_friend_link_applications_applicant_id` (`applicant_id`),
  KEY `IDX_friend_link_applications_reviewed_by_id` (`reviewed_by_id`),
  KEY `IDX_friend_link_applications_friend_link_id` (`friend_link_id`),
  CONSTRAINT `FK_friend_link_applications_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `momei_user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 33. 链接治理报告表
CREATE TABLE `momei_link_governance_report` (
  `id` varchar(36) NOT NULL,
  `mode` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'completed',
  `requested_by_user_id` varchar(36) NOT NULL,
  `scopes` text NOT NULL,
  `filters` text DEFAULT NULL,
  `options` text DEFAULT NULL,
  `summary` text DEFAULT NULL,
  `statistics` text DEFAULT NULL,
  `items` text DEFAULT NULL,
  `redirect_seeds` text DEFAULT NULL,
  `markdown` text DEFAULT NULL,
  `error` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_link_governance_report_mode` (`mode`),
  KEY `IDX_link_governance_report_status` (`status`),
  KEY `IDX_link_governance_report_requested_by_user_id` (`requested_by_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 34. 通知投递审计表
CREATE TABLE `momei_notification_delivery_logs` (
  `id` varchar(36) NOT NULL,
  `notification_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `channel` varchar(32) NOT NULL,
  `status` varchar(32) NOT NULL,
  `notification_type` varchar(32) NOT NULL,
  `title` varchar(255) NOT NULL,
  `recipient` varchar(255) DEFAULT NULL,
  `target_url` varchar(255) DEFAULT NULL,
  `error_message` varchar(512) DEFAULT NULL,
  `sent_at` datetime(6) NOT NULL,
  `metadata` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_notification_delivery_logs_notification_type` (`notification_type`),
  KEY `IDX_notification_delivery_logs_channel` (`channel`),
  KEY `IDX_notification_delivery_logs_status` (`status`),
  KEY `IDX_notification_delivery_logs_sent_at` (`sent_at`),
  KEY `IDX_notification_delivery_logs_recipient` (`recipient`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 35. 设置审计日志表
CREATE TABLE `momei_setting_audit_logs` (
  `id` varchar(36) NOT NULL,
  `setting_key` varchar(128) NOT NULL,
  `action` varchar(32) NOT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `mask_type` varchar(32) NOT NULL DEFAULT 'none',
  `effective_source` varchar(32) NOT NULL DEFAULT 'db',
  `is_overridden_by_env` tinyint(1) NOT NULL DEFAULT 0,
  `source` varchar(64) NOT NULL DEFAULT 'admin_ui',
  `reason` varchar(255) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `operator_id` varchar(36) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_setting_audit_logs_setting_key` (`setting_key`),
  KEY `IDX_setting_audit_logs_operator_id` (`operator_id`),
  CONSTRAINT `FK_setting_audit_logs_operator` FOREIGN KEY (`operator_id`) REFERENCES `momei_user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 36. Web Push 订阅表
CREATE TABLE `momei_web_push_subscriptions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `endpoint` varchar(2048) NOT NULL,
  `endpoint_sha256` char(64) GENERATED ALWAYS AS (sha2(`endpoint`, 256)) STORED,
  `subscription` text NOT NULL,
  `permission` varchar(20) DEFAULT NULL,
  `user_agent` varchar(512) DEFAULT NULL,
  `locale` varchar(20) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_web_push_subscriptions_user_endpoint` (`user_id`, `endpoint_sha256`),
  CONSTRAINT `FK_web_push_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
