# TypeORM 1.0.0 升级专项评估

## 1. 背景与结论

- 当前生产依赖版本为 `typeorm@0.3.29`。
- 上游已发布 `typeorm@1.0.0`，属于大版本升级。
- 本项目在 `server/**/*.ts` 中存在 `87` 处 TypeORM 直接引用，影响面覆盖实体层、数据库初始化层、服务层、API 查询层与测试桩。

阶段结论：

1. 当前不建议直接合并大版本升级到主干。
2. 允许在第四十阶段先完成“评估 + 兼容性探针 + 回滚预案”闭环。
3. 2026-05-25 首轮兼容性探针已完成，但最小验证矩阵仍未全绿；在修完字符串数组 `select` / `relations` 旧语法之前，不进入真实升级实施任务。

## 2. 准入判定（规划口径）

按 `docs/standards/planning.md` 的新增事项分流规则，本事项当前属于“延期事项中的高优先候选”：

- 非当前阶段收口必需项。
- 尚无证据表明已构成必须立即插队的 blocker。
- 对稳定性与依赖治理价值高，适合下一阶段以评估任务先行上收。

## 3. 关键风险

1. 兼容性风险：`better-auth` 适配层对 TypeORM 查询与事务行为依赖较深，核心文件为 `server/database/typeorm-adapter.ts`。
2. 运行时风险：数据库初始化与维护链路集中在 `server/database/index.ts`，升级后冷启动、元数据探测与连接初始化行为需重新验证。
3. 生态风险：`typeorm@1.0.0` 对 Node 与驱动 peer 版本有更严格约束，若 CI 继续使用浮动 `lts/*`，可能出现“本地可过、CI 不稳定”的漂移。
4. 测试风险：仓库内存在大量依赖 TypeORM 类型或 API 形态的 mock/桩，升级后可能出现编译通过但行为回归。

## 4. 影响面分桶

1. 数据库与适配层：`server/database/**`。
2. 实体层：`server/entities/**` 与装饰器相关文件。
3. 查询与服务层：`server/services/**`、`server/utils/**` 中 QueryBuilder/Operator 相关逻辑。
4. API 层：`server/api/**` 中依赖 where/operator/relation 的入口。
5. 认证链路：`lib/auth.ts` 与 `server/database/typeorm-adapter.ts`。
6. 测试与桩：涉及 `Brackets`、`In`、`Repository`、`DataSource`、`EntityTarget` 的定向测试。

### 4.1 2026-05-25 首轮失败分桶

1. 数据库与适配层：`pnpm exec vitest run server/database/typeorm-adapter.test.ts` 与 `pnpm exec vitest run tests/server/database/init-boundary.test.ts` 全部通过；当前未发现 `better-auth` 适配层或数据库初始化边界的首个 runtime blocker。类型层仍有 `server/database/typeorm-adapter.ts` 中 `findOne({ select })` 继续传递字符串数组的问题。
2. 实体层：首轮矩阵没有复跑 `post.entity` 等实体约束测试；目前 adapter / init / public read chain 未暴露实体装饰器或 metadata 级独立断点，但该桶仍需补跑确认。
3. 查询与服务层：首个真实 runtime blocker 收敛在 `server/utils/translation.ts`。TypeORM 1.0.0 移除了字符串数组 `select` 语法，导致 `attachTranslations()` 在 categories / posts 公共读链路上直接抛错。该 helper 已在主工作区落一条前向兼容补丁，改用对象语法。
4. API 层：`pnpm run typecheck` 暴露出 `_sitemap-urls.ts`、categories slug/detail、posts export / verify-password / views、marketing campaigns、subscribers export、fed note 等入口仍大量使用字符串数组 `select` / `relations`。当前主工作区剩余基线为 `22` 处 `select: [...]` 与 `38` 处 `relations: [...]`。
5. 测试与桩：`tests/server/api/admin/posts/versions.test.ts` 等测试文件自身仍使用字符串数组 `relations`，升级实施前必须一并迁移。
6. 非 TypeORM 噪音：probe worktree 的 `pnpm run typecheck` 同时暴露 `packages/cli` 与 `packages/mcp-server` 的缺依赖类型声明错误；当前将其标记为需要单独隔离的包管理 / 环境噪音，不把它们直接计入 TypeORM runtime blocker。

## 5. 升级路径建议

### 方案 A：直接升级（不推荐）

- 优点：动作最少。
- 缺点：回归面过大，难以定位问题来源。

### 方案 B：分阶段兼容（推荐）

1. 固化 CI / 本地 Node 版本下限，避免 `lts/*` 漂移。
2. 建立 TypeORM 1.0.0 兼容性探针分支，仅改依赖与必要适配。
3. 跑最小验证矩阵，记录失败分桶与修复成本。
4. 依据结果输出 go/no-go，必要时回退依赖并保留文档证据。

### 方案 C：暂缓升级（可接受）

- 当兼容性探针显示修复成本超出本阶段容量时，保留 `0.3.29`，并设置触发条件（安全告警、上游关键修复、依赖链升级窗口）后再启动实施。

## 6. 最小验证矩阵（评估阶段）

1. 静态检查：`pnpm run typecheck`。
2. 认证适配定向测试：`server/database/typeorm-adapter.ts` 相关测试。
3. 数据库初始化与公开读链路定向测试：`server/database/index.ts` 及相关 API 测试。
4. 依赖安全与锁文件一致性：`pnpm security:audit-deps`（或等价入口）。
5. 证据沉淀：优先通过 `pnpm regression:typeorm-assessment` 把 go/no-go 与 probe 摘要自动回填到 `docs/reports/regression/current.md`，详细 failure buckets 继续以本文档为准。

### 6.1 2026-05-25 首轮探针实测

1. `git worktree add --detach /workspaces/momei-typeorm-probe HEAD && cd /workspaces/momei-typeorm-probe && pnpm up typeorm@1.0.0`
   - 结果：完成隔离 probe，不污染主工作区依赖版本。
2. `pnpm exec vitest run server/database/typeorm-adapter.test.ts`
   - 结果：通过（`11/11`）。`better-auth` TypeORM 适配层未出现首个 runtime 断点。
3. `pnpm exec vitest run tests/server/database/init-boundary.test.ts`
   - 结果：通过（`2/2`）。`ensureDatabaseConnectionReady()` 与 `ensureDatabaseReady()` 的分层契约在 probe 下仍成立。
4. `pnpm exec vitest run tests/server/api/categories/index.get.test.ts tests/server/api/posts/index.get.test.ts`
   - 结果：首次失败。共同错误为 `String-array "select" syntax has been removed`，调用栈统一落在 `server/utils/translation.ts` 的 `attachTranslations()`。
5. 应用最小兼容补丁后，`pnpm exec vitest run tests/server/api/categories/index.get.test.ts tests/server/api/posts/index.get.test.ts tests/server/api/tags/index.get.test.ts`
   - 结果：通过（`41/41`）。说明公共热点读链路的首个 runtime blocker 已被局部收敛。
6. `pnpm run typecheck`
   - 结果：失败（`76 errors / 49 files`）。TypeORM 直接相关的主因是字符串数组 `select` / `relations` 旧语法收紧，以及 `server/api/admin/ai/stats.get.ts` 对 `dataSource.options.type` 的 narrowing 需要更新。
7. `pnpm security:audit-deps`
   - 结果：通过；`relevant risks: 0`，未发现新的 `high+` 依赖风险。

## 7. 回滚与止损

1. 锁定旧版本回退锚点：`typeorm@0.3.29`。
2. 回滚优先顺序：依赖版本 -> 适配层临时补丁 -> 验证矩阵重跑。
3. 若出现以下任一情况，直接 `no-go` 并停止上收实现：
   - 认证主链路不可在受控成本内恢复。
   - 数据库初始化链路在核心环境出现不可接受回归。
   - 定向测试无法在阶段容量内恢复稳定通过。

## 8. 最终 go/no-go 建议

- 当前建议：`NO-GO（直接升级）`。首轮 probe 已证明适配层与初始化层不是首个 blocker，但 `typecheck` 仍显示 `select` / `relations` 旧语法迁移面较大，主工作区剩余基线为 `22` 处字符串数组 `select` 与 `38` 处字符串数组 `relations`。
- 当前建议：`GO（评估任务上收）`。
- 下一触发点：先完成 `FindOptionsSelect` / `FindOptionsRelations` 语法迁移、隔离 `packages/**` 的 typecheck 噪音并重跑 `pnpm run typecheck`；待最小验证矩阵全绿后，再决定是否把“真实升级实施”写入后续阶段。
