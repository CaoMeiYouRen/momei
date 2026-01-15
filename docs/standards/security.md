# 安全开发规范 (Security Development Standards)

## 1. 身份验证与授权 (Authentication & Authorization)

-   **严格鉴权**: 所有涉及用户数据的 API 必须通过 `auth.global.ts` 或具体的路由中间件校验 `session`。
-   **权限最小化**: 严格区分角色权限。由于用户可能拥有多个角色（以逗号分隔），严禁使用 `role === 'admin'` 等判等逻辑。必须使用 `hasRole(role, 'admin')` 或 `isAdmin(role)` 等工具函数进行包含性校验。
-   **密码安全**: 严禁在数据库中存储明文密码。使用 Better-Auth 默认的安全哈希机制。

## 2. 数据安全 (Data Security)

-   **输入校验**: 所有 API 输入必须使用 `zod` 或类似工具进行模式校验，严禁直接信任 `getQuery` 或 `readBody` 的结果。
-   **防止注入**: 使用 Drizzle ORM 或类似工具的参数化查询，严禁拼接 SQL 字符串。
-   **敏感信息屏蔽**: API 返回结果前必须脱敏（如隐藏邮箱中间部分、去掉密码字段等）。
-   **Secrets 管理**: 严禁将 API Keys、数据库密码等提交至 Git。必须使用 `.env` 环境文件并在 `nuxt.config.ts` 中声明。

## 3. Web 安全防护 (Web Protection)

-   **XSS 防护**: 默认使用 Vue 的模板转义。对于 `v-html` 的使用必须进行严格审计。
-   **CSRF 防护**: 确保 API 启用了必要的 CSRF Token 校验或使用 SameSite Cookie 策略。
-   **CORS 策略**: 生产环境严禁配置 `Access-Control-Allow-Origin: *`。

## 4. 日志与监控 (Logging & Monitoring)

-   **日志审计**: 重要操作（登录、删除、权限变更）必须记录审计日志。
-   **无敏感信息日志**: 日志输出中严禁包含密码、Token、详细身份证据等信息。

## 5. 依赖安全 (Dependency Security)

-   **定期更新**: 关注依赖包的安全漏洞公告。
-   **最小化依赖**: 引入新包需经过必要性评估，优先使用官方或社区公认的安全库。
