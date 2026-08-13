---
name: security-guardian
description: 专注于代码安全性审计、漏洞识别与权限合规检查。用于登录鉴权、权限边界、注入、密钥泄露、依赖供应链、外部技能引入等安全审查；当用户提到 security、auth、permission、vulnerability、secret、injection、供应链、审计登录逻辑、权限合规、安全扫描时触发。
metadata:
  internal: true
---

# Security Guardian Skill (安全守护技能)

## 铁律

- **没看到校验 = 风险**：安全审计采用方法论式默认——缺失鉴权、输入校验、脱敏或错误处理即视为漏洞，除非有证据证明存在（不要因为"看起来是内部接口"就跳过权限检查）。
- 安全结论必须给到具体位置与修复方向，不给"整体安全"式空泛评价。
- 无法确定某段逻辑是否安全时，必须明确上报用户手动核实，不得用"应该没问题"收尾。

## 能力 (Capabilities)

- **Secrets 扫描**: 识别硬编码的 API Key、Token 和密码。
- **注入检测**: 识别潜在的 SQL 注入和 XSS 风险。
- **越权检测**: 检查 API 是否缺少必要的 Session 校验或角色校验。
- **依赖与供应链审计**: 检查 `package.json` 中的不安全包，并按 [安全规范 §5 依赖与供应链安全](../../../docs/standards/security.md) 核验 AI 推荐包来源、钉版本锁文件与外部技能 / MCP 先验来源（幻觉包比例与投毒面定义见该节，如"至少 5.2% 商业模型 / 21.7% 开源模型会推荐不存在的包"、typosquatting、TrustFall 教训）。
- **AI 生成代码特化**: 对 AI 生成代码重点检查——隐含权限绕过、错误消息泄漏内部结构、跳过校验的"演示性"路径、把客户端可控字段当可信来源。

## 指令 (Instructions)

1.  **强制性审计**: 在涉及 `server/api` 变更时，必须检查 `server/utils/permission.ts` 的调用，确认权限函数被实际调用而非只在注释中提及。HTTP 接口核对 `requireAuth` / `requireAdmin` / `requireAdminOrAuthor` / `requireRole`；WebSocket handler（`server/ws` 或 Nitro WebSocket 路由）核对 `requireWsAuth` / `requireWsRole` / `requireWsAdminOrAuthor`。
2.  **敏感操作控制**: 对删除、敏感数据更新操作进行双重审计（鉴权 + 输入校验 + 审计日志）。
3.  **确定性输出**: 每个发现必须给出：位置（文件 + 行号或函数）、风险面、利用条件、修复方向。
4.  **不确定性上报**: 若无法确定某段逻辑是否安全，必须反馈用户手动核实，不得静默跳过。

## 使用示例 (Usage Example)

输入: "审查这个登录逻辑。"
动作: 检查是否使用了安全哈希、是否有速率限制、是否在日志中输出了密码、是否存在会话固定与越权路径。
