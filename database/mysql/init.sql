-- 墨梅 (Momei) MySQL 初始化脚本

-- 1. 用户表
CREATE TABLE `momei_user` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified` tinyint NOT NULL DEFAULT 0,
  `image` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `role` varchar(255) NOT NULL DEFAULT 'user',
  `banned` tinyint NOT NULL DEFAULT 0,
  `ban_reason` varchar(255) DEFAULT NULL,
  `ban_expires` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. 账号表
CREATE TABLE `momei_account` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
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
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_token` (`token`),
  KEY `FK_session_user` (`user_id`),
  CONSTRAINT `FK_session_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. 验证码表
CREATE TABLE `momei_verification` (
  `id` varchar(255) NOT NULL,
  `identifier` text NOT NULL,
  `value` text NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_verification_identifier_value` (`identifier`(255), `value`(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5. 二步验证表
CREATE TABLE `momei_two_factor` (
  `id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `secret` text NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_two_factor_user` (`user_id`),
  CONSTRAINT `FK_two_factor_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6. JWKS 表
CREATE TABLE `momei_jwks` (
  `id` varchar(255) NOT NULL,
  `public_key` text NOT NULL,
  `private_key` text NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 7. 分类表
CREATE TABLE `momei_category` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_id` varchar(255) DEFAULT NULL,
  `language` varchar(255) NOT NULL DEFAULT 'zh',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_category_slug` (`slug`),
  KEY `FK_category_parent` (`parent_id`),
  CONSTRAINT `FK_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `momei_category` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 8. 标签表
CREATE TABLE `momei_tag` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `language` varchar(255) NOT NULL DEFAULT 'zh',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_tag_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 9. 文章表
CREATE TABLE `momei_post` (
  `id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `summary` text DEFAULT NULL,
  `cover_image` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'draft',
  `language` varchar(255) NOT NULL DEFAULT 'zh',
  `views` int NOT NULL DEFAULT 0,
  `published_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `author_id` varchar(255) NOT NULL,
  `category_id` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_post_slug` (`slug`),
  KEY `IDX_post_author` (`author_id`),
  KEY `IDX_post_category` (`category_id`),
  CONSTRAINT `FK_post_author` FOREIGN KEY (`author_id`) REFERENCES `momei_user` (`id`),
  CONSTRAINT `FK_post_category` FOREIGN KEY (`category_id`) REFERENCES `momei_category` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 10. 文章-标签中间表
CREATE TABLE `momei_post_tags_momei_tag` (
  `momei_post_id` varchar(255) NOT NULL,
  `momei_tag_id` varchar(255) NOT NULL,
  PRIMARY KEY (`momei_post_id`, `momei_tag_id`),
  KEY `IDX_post_tags_post` (`momei_post_id`),
  KEY `IDX_post_tags_tag` (`momei_tag_id`),
  CONSTRAINT `FK_post_tags_post` FOREIGN KEY (`momei_post_id`) REFERENCES `momei_post` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_post_tags_tag` FOREIGN KEY (`momei_tag_id`) REFERENCES `momei_tag` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 11. API Key 表
CREATE TABLE `momei_api_key` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `key` text NOT NULL,
  `prefix` varchar(16) NOT NULL,
  `last_used_at` datetime(6) DEFAULT NULL,
  `expires_at` datetime(6) DEFAULT NULL,
  `user_id` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_api_key_user` (`user_id`),
  CONSTRAINT `FK_api_key_user` FOREIGN KEY (`user_id`) REFERENCES `momei_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
