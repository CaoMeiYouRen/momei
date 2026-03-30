---
name: code-quality-auditor
description: 审查 git 变更、Review Gate、merge ready、发布前审计以及代码、文档、配置、脚本质量门禁时使用。输出结构化 Pass 或 Reject 结论、问题分级、最低验证矩阵、证据链和复查基线；当用户提到 review、code review、审计、review gate、merge ready、blocker、evidence、pass、reject 时触发。
metadata:
  internal: true
---

# Code Quality Auditor

## 铁律

- 先给 Review Gate 结论、阻塞原因和复查基线，再给摘要。
- 没有最低验证证据，不得给 `Pass`。
- `Pass` / `Reject` 是 Gate 结论，`suggest` / `warning` / `blocker` 是问题分级，二者不能混用。
- 文档、规划、配置、脚本与测试代码同样属于正式审查对象，不能因为“不是业务代码”而跳过。

## 必读依据

- [AI 协作规范](../../../docs/standards/ai-collaboration.md)
- [开发规范](../../../docs/standards/development.md)
- [安全规范](../../../docs/standards/security.md)
- [测试规范](../../../docs/standards/testing.md)
- [验证矩阵](./references/validation-matrix.md)
- [审查清单](./references/review-checklist.md)
- [证据模板](./references/evidence-template.md)

## 工作流

### 1. 建立审查上下文

- 读取 git diff、变更文件清单、Todo 验收点和已有验证结果。
- 没有 diff 时，明确指出“当前没有可审查改动”，并要求用户指定 staged changes、提交范围或文件范围。
- 先识别关键入口与高风险区域，例如鉴权、数据写入、外部调用、构建配置、规范文档、治理脚本和 agent / skill 定义。

### 2. 判定改动类型与最低验证要求

- 使用 [验证矩阵](./references/validation-matrix.md) 先确定最低验证层级，再决定需要补哪些命令。
- 代码改动默认至少包含 `pnpm lint` 和 `pnpm typecheck`；样式改动补 `pnpm lint:css`；Markdown / 文档改动补 `pnpm lint:md`。
- 测试不是所有场景都一刀切全量执行，必须按风险选择定向测试、全量测试、coverage、E2E 或性能验证。
- 若实际证据低于最低层级，直接判定为 `Reject`，而不是“暂时通过”。

### 3. 收集并延续审查证据

- 默认把临时审查记录写入 git ignore 的 `artifacts/review-gate/`，文件名建议使用 `<date>-<scope>.md`。
- 多轮 review 复用同一份记录，按 `Round 1`、`Round 2` 追加，保留未关闭问题编号与复查结论。
- 证据记录至少包含：变更范围、已执行验证、结果摘要、问题分级、Gate 结论、未覆盖边界、后续补跑计划。

### 4. 执行结构化审查

- 用 [审查清单](./references/review-checklist.md) 逐项覆盖正确性、安全、职责边界、可删除残留、测试充分性与文档漂移。
- 优先寻找会阻塞放行的问题，而不是按文件顺序复述 diff。
- 重点检查是否存在遗漏 mock、异常吞掉、权限边界缺失、证据链不闭环、超出当前 Todo 范围的静默扩写。

### 5. 判定问题分级

- `blocker`: 明显 correctness bug、安全漏洞、关键验证缺失、与 Todo / 规范冲突、会阻塞提交的问题。
- `warning`: 存在较高回归风险、测试覆盖不足、结构边界模糊或证据不完整，但不一定立刻造成故障。
- `suggest`: 非阻塞的可维护性、可读性、删除计划或后续优化建议。

### 6. 给出 Review Gate 结论

- 只有在所有 `blocker` 关闭且最低验证矩阵满足时，才允许给 `Pass`。
- `Reject` 必须明确写出失败原因、缺失证据、待修问题和复查基线。
- 对多轮 review，必须说明“本轮新增问题”“本轮已关闭问题”“仍待复查问题”，避免每轮都重新洗牌。

## 输出要求

```md
## Review Gate
- 结论: Pass | Reject
- 改动类型:
- 最低验证要求:
- 审查轮次:
- 失败原因或通过条件:
- 复查基线:

## Findings
### blocker
1. [path/to/file.ext] 标题
	- 风险
	- 修复方向

### warning

### suggest

## 验证证据
- 已执行验证:
- 结果摘要:
- 未覆盖边界:
- 后续补跑计划:
```

## 反模式

- 只写“已审查通过”而不说明依据。
- 只跑 `lint` / `typecheck` 就给所有改动 `Pass`。
- 把问题分级当成最终 Gate 结论，或者把 `warning` 写成“已通过”。
- 审查文档、脚本、配置、技能文件时不补充对应的最小验证。
- 没有复查基线，导致多轮 review 无法对账。

## 审查前检查

- 是否已经读取相关规范与当前 Todo 验收点。
- 是否已经识别改动类型并映射到最低验证矩阵。
- 是否已经记录证据落点和本轮审查范围。
- 是否已经把阻塞项和残余风险区分清楚。
