# 安全开发规范 (Security Development Standards)

## 0. 事实源与边界 (Source & Scope)

### 0.1 唯一事实源
本文档是安全开发的详细实施规范，定义具体的安全控制措施和技术要求。

本文档与 `AGENTS.md` 第 7 节"安全与行为红线"的关系是**引用而非重复**：
- `AGENTS.md` 第 7 节定义项目级安全红线和禁止行为
- 本文档作为 `AGENTS.md` 第 7.2 节"终端操作安全"的详细实施规范，提供具体的技术要求和操作准则

### 0.2 非目标内容
以下内容不属于本规范范围：
- **Web 应用防火墙 (WAF) 配置**: 属于基础设施层面，请参考部署文档
- **数据库加密方案**: 属于运维安全范畴
- **CDN 安全配置**: 属于部署架构文档
- **API 响应时间**: 属于性能规范范围，参考 [性能基准与优化规范](./performance.md)

### 0.3 权限实现权威源
权限校验的技术实现以 `server/utils/permission.ts` 中的函数为准：
- `requireAuth(event)`: 校验用户是否已登录
- `requireAdmin(event)`: 校验用户是否为管理员
- `requireAdminOrAuthor(event)`: 校验用户是否为管理员或作者
- `requireRole(event, roles)`: 校验用户是否具有指定角色
- `requireWsAuth(request)`: WebSocket 场景校验用户是否已登录
- `requireWsRole(request, roles)`: WebSocket 场景校验用户是否具有指定角色
- `requireWsAdminOrAuthor(request)`: WebSocket 场景校验用户是否为管理员或作者

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

## 5. 依赖与供应链安全 (Dependency & Supply Chain Security)

### 5.1 依赖审计

-   **定期更新**: 关注依赖包的安全漏洞公告（Dependabot / `pnpm audit`），高危告警优先处理。
-   **最小化依赖**: 引入新包需经过必要性评估，优先使用官方或社区公认的安全库。
-   **审计进 CI**: 依赖安全审计应纳入 CI 或定期回归任务，本地抽查不能代替流水线检查。

### 5.2 供应链信任边界 (Supply Chain Trust Boundary)

引入新依赖、MCP server、外部 skill/agent，或采纳 AI 推荐的包时，必须执行来源验证，不得默认信任：

1.  **AI 推荐包来源验证**: AI 推荐的包名常有相当比例在官方 registry 中不存在（幻觉包，研究实测至少 5.2% 的商业模型与 21.7% 的开源模型会推荐不存在的包，见 *We Have a Package for You! A Comprehensive Analysis of Package Hallucinations in Code-Generating LLMs*，Spracklen et al.，arXiv:2406.10279，USENIX Security 2025）。引入前必须在官方 registry 实际检索确认存在性，并核验拼写（typosquatting，如 `lodahs` vs `lodash`），不得凭包名直接安装。
2.  **钉版本 + 锁文件**: 依赖必须钉版本并提交锁文件（`pnpm-lock.yaml`）；CI / Dockerfile / 自动化脚本中的工具版本使用不可变版本（tag / SHA），禁止浮动标签。
3.  **外部技能 / agent / MCP 先验来源**: 引入外部 skill、agent 或 MCP server 前，必须核对来源仓库 URL 与维护组织是否为可信主体；警惕伪装成"有用文档 / 技能"诱导信任的投毒载体（TrustFall 教训），先验来源核验详见 [AI 资产治理规范 §2.2](./ai-governance.md#22-外部同步或平台提供资产)。
4.  **依赖方向约束**: 新增内部包或依赖时，遵守 [开发规范 §2.4 目录规划与依赖约束](./development.md#24-目录规划与依赖约束-directory-structure--dependencies) 的单向依赖约束，禁止循环依赖与应用层互依。

## 6. 终端命令与自动化安全 (CLI & Automation Security)

在执行任何自动化脚本或终端操作时，必须遵循以下安全准则：

-   **环境检查**: 在执行任何 shell 命令之前，必须先检查当前的操作系统 (Windows, Linux, macOS) 和运行环境 (CMD, PowerShell, Bash 等)，确保命令语法的兼容性。
-   **路径校验**: 在执行涉及文件或文件夹删除的命令 (如 `rm`, `dir /s`, `rd` 等) 前，必须显式验证目标路径的存在性及有效性。
-   **空路径规避**: 严禁将空字符串、未定义的变量或通配符（如 `/*`）单独作为路径参数传递给删除命令。严禁执行类似于 `rm -rf /` 或 `rm -rf $EMPTY_VAR/*` 的高危操作。

## 7. 不可简化清单 (Non-Negotiable Checklist)

以下项目绝对不能简化，无论采用何种实现策略：

- **输入校验**: 所有 API 输入必须经过 `zod` 或类似工具校验
- **鉴权逻辑**: 涉及用户数据的接口必须有正确的权限边界
- **XSS 防护**: 用户输入渲染到页面前必须转义或清理
- **SQL 注入防护**: 必须使用参数化查询，严禁拼接 SQL
- **敏感信息脱敏**: API 返回前必须隐藏密码、Token 等字段
- **错误处理**: 关键操作的异常不能静默吞掉，必须记录或抛出
- **国际化文本**: UI 文本必须使用 `$t()` 包裹，不能硬编码

定制建议：
- 支付系统：增加"幂等性检查"和"审计日志"
- 数据迁移：增加"回滚路径"和"数据校验"
- 前端组件：增加"键盘导航"和"屏幕阅读器标签"
