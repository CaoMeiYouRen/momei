-- 墨梅 (Momei) MySQL 初始化脚本（基于当前 server/entities）

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
  `copyright` text DEFAULT NULL,
  `meta_version` int NOT NULL DEFAULT 1,
  `metadata` json DEFAULT NULL,
  `audio_url` text DEFAULT NULL,
  `audio_duration` int DEFAULT NULL,
  `audio_size` int DEFAULT NULL,
  `audio_mime_type` varchar(100) DEFAULT NULL,
  `tts_provider` varchar(50) DEFAULT NULL,
  `tts_voice` varchar(50) DEFAULT NULL,
  `tts_generated_at` datetime(6) DEFAULT NULL,
  `scaffold_outline` text DEFAULT NULL,
  `scaffold_metadata` json DEFAULT NULL,
  `publish_intent` json DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `memos_id` varchar(255) DEFAULT NULL,
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
  KEY `IDX_post_published_at` (`published_at`),
  KEY `IDX_post_memos_id` (`memos_id`),
  CONSTRAINT `FK_post_author` FOREIGN KEY (`author_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_post_category` FOREIGN KEY (`category_id`) REFERENCES `momei_category` (`id`) ON DELETE SET NULL
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

-- 20. ASR 配额表
CREATE TABLE `momei_asr_quotas` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `provider` varchar(50) NOT NULL,
  `period_type` varchar(20) NOT NULL,
  `used_seconds` int NOT NULL DEFAULT 0,
  `max_seconds` int NOT NULL DEFAULT 3600,
  `reset_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_asr_quotas_user_provider_period` (`user_id`, `provider`, `period_type`),
  KEY `IDX_asr_quotas_user_id` (`user_id`)
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
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `summary` text DEFAULT NULL,
  `author_id` varchar(36) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_post_version_post_id` (`post_id`),
  KEY `IDX_post_version_author_id` (`author_id`),
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
