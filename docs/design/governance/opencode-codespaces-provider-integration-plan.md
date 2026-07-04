# OpenCode + GitHub Codespaces 提供商收敛集成方案（opencode-go / deepseek / xiaomi-mimo）

## 1. 概述 (Overview)

本文档用于把“Hermes + OpenCode + GitHub Codespaces 集成方案”落地为可执行的仓库改动清单，并明确当前模型提供商收敛策略：

- 保留 `opencode-go`、`deepseek`、`xiaomi-mimo` 三类模型提供商。
- 以 `.opencode/configs/` 作为 OpenCode 模型配置的事实源。
- `opencode.json` 仅作为当前激活配置的派生结果。

该方案聚焦“配置与流程收敛”，不直接包含功能代码实现。

## 2. 准入结论 (Intake Decision)

- 结论：允许作为专项设计文档先落盘，执行时按独立基础设施任务推进。
- 原因：当前 `todo.md` 主线是缓存架构与治理深化，本事项属于开发工具链集成与运行环境治理，不宜静默插入当前功能主线。
- 执行建议：以“专项任务”方式推进，先完成最小可运行闭环，再逐步收敛策略。

## 3. 现状基线 (Current Baseline)

当前仓库已具备以下基础：

1. OpenCode 主配置已存在：[opencode.json](../../../opencode.json)
2. 多个 OpenCode 预设已存在：[.opencode/configs/](../../../.opencode/configs)
3. 模型切换脚本已存在：[scripts/setup/switch-models.mjs](../../../scripts/setup/switch-models.mjs)
4. AI 工作树软链接脚本已存在：[scripts/setup/setup-ai.mjs](../../../scripts/setup/setup-ai.mjs)
5. Codespaces 容器配置存在但位于根目录：[devcontainer.json](../../../devcontainer.json)

已识别差异：

1. 容器镜像版本为 Node 18，而项目 `engines.node` 要求 `>=20`。
2. `opencode.opencode-go.json` 仍包含 `glm`、`qwen` 等非目标模型，与当前收敛目标不一致。
3. 尚无“提供商白名单”层面的显式治理规则，切换脚本仍可面向全部预设。

### 3.1 Node 24 镜像可用性核实

核实结论：Node 24 的官方 devcontainer 镜像标签可用，后续可按 Node 24 作为容器默认目标版本。

已核实的公开标签（MCR）：

1. `mcr.microsoft.com/devcontainers/typescript-node:24-bookworm`
2. `mcr.microsoft.com/devcontainers/typescript-node:24`
3. `mcr.microsoft.com/devcontainers/javascript-node:24-bookworm`

核实方式：通过带超时的 HTTP 请求抓取 MCR 标签列表（`TimeoutSec=15`），避免网络异常导致探测流程长时间阻塞。

## 4. 目标状态 (Target State)

### 4.1 提供商策略

运行链路只允许以下两类提供商：

1. `opencode-go/*`
2. `deepseek/*`
3. `xiaomi-mimo/*`

### 4.2 执行原则

1. 复用仓库内现有 OpenCode 配置，不在 Codespace 内维护平行的私有配置源。
2. `.opencode/configs/` 是唯一预设事实源；`opencode.json` 由切换脚本写入。
3. 统一通过仓库脚本完成模型切换与治理，不依赖人工手改 JSON。
4. 以最小改动优先，先完成可运行，再做收紧。

### 4.3 Codespaces 手动设置 vs OpenCode 配置文件

当前有两条可行路径：

1. 在 GitHub Codespaces 中手动执行 `/connect`、`/model`，逐个设置提供商与模型。
2. 在仓库配置（`.opencode/configs/*.json` + `opencode.json`）中声明提供商与模型，通过脚本切换激活态。

对比结论如下：

| 维度 | Codespaces 手动设置 | OpenCode 配置文件声明 |
| :--- | :--- | :--- |
| 可复现性 | 低：依赖个人操作顺序与习惯 | 高：配置与脚本可审计、可复用 |
| 团队一致性 | 低：多人环境容易漂移 | 高：同一分支默认一致 |
| 治理成本 | 高：需要反复口头同步 | 低：规则集中在仓库文件 |
| 首次上手速度 | 中：单人试用快 | 中：首次需要理解预设与切换脚本 |
| 临时调试灵活性 | 高：可即时切换 | 中：推荐通过脚本切换而非手改 |

建议：本项目采用“配置文件优先、手动设置兜底”的策略。

1. 日常开发与协作：以 `.opencode/configs/` 为事实源。
2. 紧急排障或临时试验：允许在 Codespace 手动切换，但任务结束后必须回到仓库预设并记录原因。

### 4.4 OpenCode Go 为内置提供商时，写入配置会发生什么

OpenCode Go 是 OpenCode 内置 provider。将模型写入配置后，行为是“显式选择内置 provider”，不是“新增自定义 provider”。

1. 当模型写为 `opencode-go/<model-id>`（例如 `opencode-go/deepseek-v4-pro`）时，OpenCode 会按内置 OpenCode Go 路由请求。
2. 这不会破坏 `/connect` 流程；`/connect` 仍可用于交互式录入凭据。
3. 在自动化场景（Codespaces / CI）中，推荐通过配置映射环境变量到 `provider.options.apiKey`，避免依赖交互式录入。

补充说明：官方文档明确支持 `{env:VARIABLE}` 通用变量替换机制，但未强制规定 OpenCode Go 必须使用某个固定环境变量名。因此 `OPENCODE_GO_API_KEY` 可作为本仓库约定命名，而非官方硬编码键名。

## 5. 具体改动方案 (File-level Change Plan)

### 5.1 P0：必须改动

| 文件 | 改动类型 | 具体改动 |
| :--- | :--- | :--- |
| [devcontainer.json](../../../devcontainer.json) | Update | 基础镜像升级到 Node 24（推荐 `mcr.microsoft.com/devcontainers/typescript-node:24-bookworm`）；`postCreateCommand` 中保留 `pnpm install`，并新增 OpenCode 可用性检查（安装或版本检测）。 |
| [opencode.json](../../../opencode.json) | Update | 默认模型收敛到三提供商之一（`opencode-go/deepseek-v4-pro`、`deepseek/deepseek-v4-pro`、`xiaomi-mimo/mimo-v2.5-pro`）；`instructions` 继续指向 `AGENTS.md`。 |
| [.opencode/configs/opencode.opencode-go.json](../../../.opencode/configs/opencode.opencode-go.json) | Update | 所有 agent 模型统一为 `opencode-go/deepseek-v4-pro` 或 `opencode-go/deepseek-v4-flash`，移除 `opencode-go/glm-*` 与 `opencode-go/qwen*`。 |
| [.opencode/configs/opencode.deepseek.json](../../../.opencode/configs/opencode.deepseek.json) | Verify | 校验所有 agent 仅使用 `deepseek/*`，保持与目标策略一致。 |
| [.opencode/configs/opencode.xiaomi-mimo.json](../../../.opencode/configs/opencode.xiaomi-mimo.json) | Verify | 保持 xiaomi-mimo 预设可用，并校验模型字段只落在 `xiaomi-mimo/*`。 |
| [scripts/setup/switch-models.mjs](../../../scripts/setup/switch-models.mjs) | Update | 增加 provider allowlist 校验（仅允许 opencode-go / deepseek / xiaomi-mimo）；保留 `--list`、`--current`。 |

### 5.2 P1：建议改动

| 文件 | 改动类型 | 具体改动 |
| :--- | :--- | :--- |
| [scripts/README.md](../../../scripts/README.md) | Update | 在 `setup` 章节新增“模型提供商白名单”说明与标准切换命令。 |
| [docs/guide/ai-development.md](../../../docs/guide/ai-development.md) | Update | 增补 Codespaces + OpenCode 最小使用流程，强调“.opencode/configs 为事实源，opencode.json 为激活态”。 |

## 6. 预设与映射建议 (Preset Mapping)

### 6.1 推荐保留预设

1. `opencode-go`（执行主力）
2. `deepseek`（降级与兜底）
3. `xiaomi-mimo`（保留为专项任务备用预设）

### 6.2 推荐默认预设

建议将默认预设设为 `opencode-go`，原因：

1. 与“供应商策略”一致。
2. 能保持与现有 `opencode-go/deepseek-v4-pro` 配置连续性。
3. 当 `opencode-go` 不可用时，可快速切换到 `deepseek` 或 `xiaomi-mimo` 预设。

## 7. Secrets 与环境变量方案 (Secrets & Env)

GitHub Codespaces Secrets 最小集合：

1. `OPENCODE_GO_API_KEY`（推荐命名；用于 OpenCode Go）
2. `DEEPSEEK_API_KEY`（若直连 DeepSeek）
3. `OPENROUTER_API_KEY`（若通过 OpenRouter 调度）
4. `GITHUB_TOKEN` 或等效 PAT（用于仓库操作与 API 调用）

约束：

1. 不在仓库内提交任何明文密钥。
2. 不在文档中写入真实密钥示例。

推荐配置写法（示意）：

```json
{
	"provider": {
		"opencode-go": {
			"options": {
				"apiKey": "{env:OPENCODE_GO_API_KEY}",
				"timeout": 300000
			}
		}
	}
}
```

说明：`timeout` 可按任务时延需求调整；抓取或长上下文任务建议提高超时，交互式任务保持默认即可。

## 8. Hermes 编排改动点 (Hermes Orchestration Plan)

Hermes Skill（`codespace-coding`）按以下步骤执行：

1. 校验 Codespace 状态（存在且运行）
2. 进入工作目录并执行预设切换命令
3. 调用 OpenCode 非交互任务
4. 拉取 diff 与关键文件内容
5. 回传结构化结果（改动文件、验证结果、失败原因）

建议命令模板：

```bash
pnpm node scripts/setup/switch-models.mjs opencode-go
```

降级模板：

```bash
pnpm node scripts/setup/switch-models.mjs deepseek
```

备用模板：

```bash
pnpm node scripts/setup/switch-models.mjs xiaomi-mimo
```

## 9. 验证矩阵 (Validation Matrix)

| 层级 | 验证项 | 验证方式 |
| :--- | :--- | :--- |
| V0 | 变更范围正确 | 对照本方案中的文件级清单 |
| V1 | 配置语法有效 | JSON 语法检查 + `pnpm typecheck` |
| V2 | 切换脚本有效 | `switch-models --list` / `--current` / 切换往返测试 |
| V2 | Codespace 可执行 | 远程执行 `opencode -p` 最小任务 |
| RG | 审计结论 | Review Gate 输出 Pass / Reject |

## 10. 回滚策略 (Rollback)

若 provider 收敛导致任务失败率明显上升：

1. 先回滚 `opencode.json` 默认预设到上一个可用配置。
2. 保留 `switch-models` allowlist 逻辑，只临时放开单一候选预设做故障排查。
3. 在专项文档追加“失败样本 + 根因 + 下一步收敛策略”，避免反复横跳。

## 11. 里程碑与交付 (Milestones)

1. M1（配置收敛）：完成 P0 文件改动并通过 V1。
2. M2（执行打通）：Hermes -> Codespace -> OpenCode 最小链路通过。
3. M3（治理收口）：文档、脚本说明、审计证据同步完成。

---

关联文档：

- [CLI / MCP 自动化能力扩展设计](./cli-mcp-automation.md)
- [AI 协作规范](../../standards/ai-collaboration.md)
- [安全开发规范](../../standards/security.md)
