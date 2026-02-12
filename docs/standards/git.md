# Git 工作流与多工作树管理规范 (Git Workflow & Worktree Standards)

## 1. 分支管理策略 (Branching Strategy)

项目采用多分支并行管理模式，各分支职责明确，以提高并发开发效率：

| 分支名称 | 职责描述 | 工作树目录 (示例) |
| :--- | :--- | :--- |
| `master` | **主分支**：仅用于代码合并、发布版本及 Hotfix，禁止日常开发提交。 | `momei` (主目录) |
| `dev` | **开发分支**：用于日常功能开发、特性实现及常规迭代。 | `../momei-dev` |
| `test` | **测试分支**：专注于自动化测试编写、集成测试及质量验证。 | `../momei-test` |
| `fix` | **修复分支**：用于修复非功能性 Bug、代码重构或紧急修复。 | `../momei-fix` |
| `docs` | **文档分支**：专门用于维护项目文档、更新技术手册及多语言支持。 | `../momei-docs` |

## 2. Git Worktree 规范

为了避免频繁切换分支导致的 `node_modules` 重新编译及上下文丢失，推荐使用 `git worktree` 管理多个分支。

### 2.1 目录命名规范
- 所有工作树目录必须位于项目主目录的**同级**。
- 采用 `momei-` 前缀 + 分支名进行命名。
- 例如：`../momei-dev`, `../momei-test`。

### 2.2 创建工作树
使用以下命令添加工作树：
```bash
git worktree add ../momei-dev dev
git worktree add ../momei-test test
git worktree add ../momei-fix fix
git worktree add ../momei-docs docs
```

### 2.3 工作树维护与清理
- **定期同步**：各工作树应定期执行 `git pull --rebase` 保持与远程同步。
- **及时清理**：对于临时创建或不再使用的工作树，必须使用规范命令移除，严禁直接手动删除目录：
  ```bash
  # 安全移除工作树
  git worktree remove ../momei-temp-branch
  # 清理过期的 Git 元数据
  git worktree prune
  ```

## 3. 合并与集成 (Integration)

- **合并方向**：所有特性开发完成后，应从对应工作树提交代码，并向 `master` 或 `dev` 分支发起合并请求（Pull Request/Merge Request）。
- **同步原则**：在 `master` 分支发生重大更新（如合并了新的 Hotfix）后，其他活跃工作树应及时合入或重定位 (Rebase) 到最新的基准点。

## 4. AI 智能体行为准则

- **分支感知**：AI 代理在执行任务前必须检查当前工作目录所属的分支。
- **自动切换**：若当前任务属于“测试”范畴，AI 应主动确认是否存在 `../momei-test` 并切换到该目录执行。
- **环境隔离**：不同工作树之间的环境配置（如 `.env`）需保持逻辑一致但环境隔离，避免相互干扰。
