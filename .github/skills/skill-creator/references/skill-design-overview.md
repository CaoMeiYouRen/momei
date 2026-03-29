# Skill Design Overview

## 为什么需要这份参考

大多数低质量技能只有一份堆满内容的 SKILL.md。结果是：

- 触发面不清晰，技能很难被自动调用。
- 正文过长，真正关键的约束被淹没。
- 没有工作流，模型会自由发挥并跳步骤。
- 缺少确认门和交付检查，输出容易失控。

这个参考文件保留了一组经过验证的技能设计方法，供 skill-creator 在设计和重构技能时按需加载。

## 12 个核心技巧

| Technique | 解决的问题 |
|-----------|------------|
| Progressive Loading | 避免上下文膨胀，让 SKILL.md 保持精炼 |
| Keyword Bombing | 提高技能触发率，让 description 更贴近用户语言 |
| Workflow Checklist | 给模型稳定执行路径，减少漏步骤 |
| Script Encapsulation | 把确定性操作下沉到脚本，节省 token |
| Question-Style Instructions | 用问题替代模糊指令，提高聚焦度 |
| Confirmation Gates | 在高风险动作前强制停顿确认 |
| Pre-Delivery Checklist | 在交付前做可验证的质量检查 |
| Parameter System | 支持参数、快速模式和局部执行 |
| Reference Organization | 按主题拆分长文档，按需加载 |
| CLI + Skill Pattern | 用 CLI 加技能替代重型 MCP 场景 |
| Iron Law | 用一条不可违反的规则防止模型偷懒 |
| Anti-Pattern Documentation | 明确禁止默认的低质量行为 |

## 推荐目录结构

```text
skill-name/
├── SKILL.md
├── scripts/
├── references/
└── assets/
```

## 设计原则

1. 优先把触发信息写进 description，而不是正文。
2. SKILL.md 只保留工作流骨架和关键约束。
3. 长知识、详细示例和清单放进 references/。
4. 可重复的确定性操作优先做成 scripts/。
5. 任何长文本都要回答一个问题：它是否真的提升了输出质量或一致性。
