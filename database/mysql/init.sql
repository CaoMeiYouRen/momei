-- 墨梅 (Momei) MySQL 初始化脚本

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
  `role` varchar(128) NOT NULL DEFAULT 'user',
  `banned` tinyint(1) NOT NULL DEFAULT 0,
  `ban_reason` text DEFAULT NULL,
  `ban_expires` int DEFAULT NULL,
  `language` varchar(16) DEFAULT NULL,
  `timezone` varchar(64) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_user_email` (`email`),
  UNIQUE KEY `UQ_user_username` (`username`),
  UNIQUE KEY `UQ_user_phone_number` (`phone_number`),
  KEY `IDX_user_username` (`username`),
  KEY `IDX_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. 账号表
CREATE TABLE `momei_account` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `account_id` varchar(255) NOT NULL,
  `provider_id` varchar(255) NOT NULL,
  `access_token` text DEFAULT NULL,
  `refresh_token` text DEFAULT NULL,
  `access_token_expires_at` datetime(6) DEFAULT NULL,
  `refresh_token_expires_at` datetime(6) DEFAULT NULL,
  `scope` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_account_user` (`user_id`),
  CONSTRAINT `FK_account_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. 会话表
CREATE TABLE `momei_session` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_session_token` (`token`),
  KEY `FK_session_user` (`user_id`),
  CONSTRAINT `FK_session_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. 验证码表
CREATE TABLE `momei_verification` (
  `id` varchar(36) NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `created_at" datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_verification_identifier_value` (`identifier`(255), `value`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. 二步验证表
CREATE TABLE `momei_two_factor` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `secret` text NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_two_factor_user` (`user_id`),
  CONSTRAINT `FK_two_factor_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. JWKS 表
CREATE TABLE `momei_jwks` (
  `id` varchar(36) NOT NULL,
  `public_key` text NOT NULL,
  `private_key` text NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. 分类表
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
  KEY `FK_category_parent` (`parent_id`),
  CONSTRAINT `FK_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `momei_category` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. 标签表
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
  UNIQUE KEY `UQ_tag_translation_language` (`translation_id`, `language`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 9. 文章表
CREATE TABLE `momei_post` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `summary` text DEFAULT NULL,
  `cover_image` text DEFAULT NULL,
  `language` varchar(10) NOT NULL DEFAULT 'zh-CN',
  `translation_id` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `visibility` varchar(20) NOT NULL DEFAULT 'public',
  `password` varchar(255) DEFAULT NULL,
  `views` int NOT NULL DEFAULT 0,
  `copyright` text DEFAULT NULL,
  `published_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `author_id` varchar(36) NOT NULL,
  `category_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_post_slug_language` (`slug`, `language`),
  KEY `IDX_post_author` (`author_id`),
  KEY `IDX_post_category` (`category_id`),
  KEY `IDX_post_slug_language` (`slug`, `language`),
  CONSTRAINT `FK_post_author` FOREIGN KEY (`author_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_post_category` FOREIGN KEY (`category_id`) REFERENCES `momei_category` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 10. 文章-标签中间表
CREATE TABLE `momei_post_tags_momei_tag` (
  `momei_post_id` varchar(36) NOT NULL,
  `momei_tag_id` varchar(36) NOT NULL,
  PRIMARY KEY (`momei_post_id`, `momei_tag_id`),
  KEY `IDX_post_tags_post` (`momei_post_id`),
  KEY `IDX_post_tags_tag` (`momei_tag_id`),
  CONSTRAINT `FK_post_tags_post` FOREIGN KEY (`momei_post_id`) REFERENCES `momei_post` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_post_tags_tag` FOREIGN KEY (`momei_tag_id`) REFERENCES `momei_tag` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 11. 评论表
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
  KEY `IDX_comment_post` (`post_id`),
  KEY `IDX_comment_author` (`author_id`),
  KEY `IDX_comment_parent` (`parent_id`),
  CONSTRAINT `FK_comment_post` FOREIGN KEY (`post_id`) REFERENCES `momei_post` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_comment_author` FOREIGN KEY (`author_id`) REFERENCES `momei_user` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_comment_parent` FOREIGN KEY (`parent_id`) REFERENCES `momei_comment` (`id`) ON DELETE CASCADE
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
  KEY `IDX_api_key_user` (`user_id`),
  CONSTRAINT `FK_api_key_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 13. 订阅者表
CREATE TABLE `momei_subscriber` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `language` varchar(10) NOT NULL DEFAULT 'zh-CN',
  `user_id` varchar(36) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_subscriber_email` (`email`),
  KEY `IDX_subscriber_user` (`user_id`),
  CONSTRAINT `FK_subscriber_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 14. 系统设置表
CREATE TABLE `momei_setting` (
  `key` varchar(128) NOT NULL,
  `value` text,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
