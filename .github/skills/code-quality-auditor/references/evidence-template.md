# Review Gate 证据模板

默认将临时审查记录写入 `artifacts/review-gate/`。该目录已被 git ignore，可用于多轮 review 对账与续查。

推荐文件名：`artifacts/review-gate/YYYY-MM-DD-<scope>.md`

## 使用方式

1.  首轮 review 创建一份记录。
2.  每轮复查在同一文件追加一个新的 `Round N` 章节。
3.  问题编号保持稳定，避免上一轮 blocker 在下一轮失联。

## 模板

```md
# Review Gate Record

- 范围:
- 关联 Todo:
- 改动类型:
- 风险等级:
- 记录路径:

## Round 1

### 变更范围
- 文件清单:
- 关键入口:

### 最低验证要求
- 目标层级:
- 需要的命令:

### 已执行验证
- 命令:
- 结果:

### Findings
#### blocker
1. RG-B01 标题
   - 位置:
   - 风险:
   - 修复方向:

#### warning

#### suggest

### Review Gate
- 结论: Pass | Reject
- 失败原因或通过条件:
- 本轮新增问题:
- 本轮已关闭问题:
- 待复查问题:

### 未覆盖边界

### 后续补跑计划

## Round 2

### 复查说明
- 本轮变更:
- 复查结论:
```

## 最低要求

- 必须写明已执行验证与未执行原因。
- 必须区分 `Pass` / `Reject` 与 `blocker` / `warning` / `suggest`。
- 必须保留未覆盖边界和补跑计划。
- 多轮 review 必须显式记录已关闭和待复查问题。
