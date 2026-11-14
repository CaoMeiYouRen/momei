# 2026-11-14 Node 26 运行时基线评估与单点化

> 适用条目：第七十五阶段条目 7「Node 26 运行时基线单点化」（插队，P1）。
> 机器事实源：仓库根 `.nvmrc`（开发侧唯一版本声明；Dockerfile 两个 ARG 为其构建期副本）、`package.json` 的 `engines.node`、`.github/workflows/*.yml` 的 `node-version-file`、`Dockerfile` 的 `NODE_BUILD_IMAGE` / `NODE_RUNTIME_IMAGE`。
> 守卫：`tests/scripts/node-runtime-baseline.test.ts`（版本单点、workflow 无 `lts/*` 与手写 `node-version`、Docker 基础镜像同源）。

## 1. 升级前现状（2026-11-14 实测）

| 位置 | 升级前 | 实际解析 |
| :--- | :--- | :--- |
| `package.json` `engines.node` | `24.x` | 安装期仅告警，不阻断 |
| `Dockerfile` 基础镜像 | `node:24.22.1-alpine` | 24.22.1 |
| CI `actions/setup-node` | `node-version: "lts/*"`（7 个 workflow / 22 处） | **26.13.1** |
| 仓库版本文件 | 无 `.nvmrc` | 本机 nvm 默认 26.13.1 |

三处漂移不是“警告噪音”，而是可复现的运行时断裂：

- 本机 Node `v26.13.1`（`process.release.lts = Lithium`，原生模块 ABI `process.versions.modules = 147`）下，`better-sqlite3@12.11.1` 直接 `ERR_DLOPEN_FAILED`（`Module did not self-register`），`/api/*` 503。
- 同一环境执行 `pnpm rebuild better-sqlite3` 时输出 `Unsupported engine: wanted {"node":"24.x"} (current {"node":"v26.13.1"})`：`engines` 与真实运行时不符，装出来的原生模块与运行时 ABI 也不符。
- CI 已实际运行在 26.13.1，意味着“仓库声明 24、生产镜像 24、CI 26”三条链路各自为政，Docker 与 CI 的验证结论不覆盖同一运行时。

## 2. 决策

1. **单点事实源改为 `.nvmrc` = `26.13.1`**。CI 用 `node-version-file: .nvmrc` 读取，不再手写版本，避免第 23 处副本。
2. **`engines.node` = `26.x`**：接受 26 线内的补丁版本（ABI 同源），同时拒绝 24 / 22 的混用。
3. **Docker 构建与运行阶段同为 `node:26.13.1-alpine`**，保留 `--build-arg` 覆盖能力与 22 / 24 / 26 安全版校验白名单（校验逻辑不改，仍允许受控回退到其它受支持版本线）。
4. **`packages/*` 的 `engines` 保持 `^22.23.4 || ^24.22.1 || >=26.12.1`**：`api-client` / `cli` / `mcp-server` 是对外发布物，消费方运行时不受本仓应用基线约束；根包（应用本体）才收紧到 26.x。
5. 选择 26.13.1 而不是 `26-alpine` 浮动标签：镜像与 CI 必须可复现，浮动标签会让本地 / CI / 容器在三处再次分叉。

## 3. 变更清单

| 文件 | 变更 |
| :--- | :--- |
| `.nvmrc` | 新增，内容 `26.13.1` |
| `package.json` | `engines.node` `24.x` → `26.x` |
| `.github/workflows/{test,docker,release,docs,regression-weekly,dependency-risk-daily,visual-reference-refresh}.yml` | 22 处 `node-version` → `node-version-file: .nvmrc`；步骤名 `Setup Node.js@lts environment` / `Setup Node.js environment` → `Setup Node.js from .nvmrc` |
| `Dockerfile` | `NODE_BUILD_IMAGE` / `NODE_RUNTIME_IMAGE` 默认值 → `node:26.13.1-alpine`，同步首段背景注释 |
| `tests/scripts/node-runtime-baseline.test.ts` | 新增守卫：`.nvmrc` 语义化、`engines` 主版本一致、Docker 两阶段镜像同源、workflow 全部走 `node-version-file`、无 `lts/*` / 手写 `node-version` |
| `README.md` + 4 个语言版本、`docs/guide/development.md` + 3 个镜像 | 依赖要求 → Node.js `26.13.1+`（指向 `.nvmrc`） |
| `docs/standards/development.md`（+ en-US 镜像） | §4.3 增加本地运行时单点说明 |

## 4. 兼容性核查

- **pnpm 11.17.0**：CI 由 `pnpm/action-setup@v6` 安装，Docker 由 `npm i -g pnpm@11.17.0` 安装，均不依赖 `corepack`；Node 26.13.1 发行包内仍带 `corepack 0.36.0`（实测），因此不存在“26 无 corepack”导致引导失败的路径。
- **better-sqlite3 12.11.1**：Node 26 下 `pnpm rebuild` 可从官方 prebuild 直接命中，无需 `node-gyp` 源码编译；重建后 `:memory:` 建表 / 插入 / 查询全部通过。
- **Nuxt 4.6 / Nitro**：Node 26 下 `pnpm build` 成功（1m52s），`.output/server/index.mjs` 可启动。
- **Docker 基础镜像**：`node:26.13.1-alpine` 可拉取（`sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5`），镜像内 `apk add python3 make g++` 与 `npm i -g pnpm@11.17.0` 正常。
- **构建期安全校验**：Dockerfile 内的版本校验白名单未改，`26.13.1` 命中 `M===26 && (m>12 || (m===12 && p>=1))` 分支，构建通过。
- **外部 action 的 Node 来源**：`security-auto-fix.yml` 使用 `dependfix/dependfix@v1.0.0`（composite），其内部硬编码 `actions/setup-node` + `node-version: lts/*`，消费者侧无法注入版本；当前 `lts/*` 解析为 26.13.1，与基线一致。该 workflow 因此不在本仓 22 处单点内，属上游约束。**漂移触发条件**：Node 27 进入 LTS 后上游 `lts/*` 会先于本仓漂移（引擎告警复现），届时先按上游反馈要求固定版本，或在本仓 workflow 内显式补 `setup-node` 覆盖默认。

## 5. 验证证据

- 本机（Node 26.13.1）：`install --frozen-lockfile`、`build`、`.output` 探针、全量单测、`test:visual`、`test:visual:parity`、`test:perf:budget:strict`。
- 容器（`node:26.13.1-alpine`）：`docker build` + 容器内同一探针。
- 证据汇总写入 `artifacts/review-gate/2026-11-14-node26-runtime-baseline.md`（`artifacts/` 不入库，按路径在本地或 CI artifact 中查阅）。

## 6. 回滚路径

1. 同批 revert `.nvmrc`（删除）、`engines`、7 个 workflow、`Dockerfile`、README / guide / standards 文本与守卫测试。
2. 本机 `nvm install 24.22.1 && nvm use 24.22.1 && pnpm install --frozen-lockfile && pnpm rebuild better-sqlite3`（ABI 随运行时改回）。
3. 用 `node:24.22.1-alpine` 重建镜像并重跑容器探针。

kill-switch（规划期约定，本次未触发）：`node:26.13.1-alpine` 拉取失败或容器冒烟不通过时，先退到最近可用的 26.x **具体补丁标签**并同步修改 `.nvmrc` 与 Dockerfile 两个 ARG（守卫要求三者精确同源，浮动 `26-alpine` 会直接判红）；若该补丁仍不通过，则整体回退 24 基线并把条目移回 backlog。

## 7. 后续与未覆盖面

- **版本推进**：Node 26 线发新补丁时需同批改 `.nvmrc` + Dockerfile 两个 ARG，并核对文档侧人类可读版本（README×5、`docs/guide/development.md`×4、roadmap 镜像摘要、回归窗口与本文）；守卫只钉 `.nvmrc` / `engines` / Docker / workflow 四处，文档副本不在守卫内，靠本节清单人工核对。`engines` 的 `26.x` 与 workflow 无需动。
- **devcontainer 未纳入本条**：`devcontainer.json` 仍为 `typescript-node:24-bookworm`，其 `postCreateCommand` 依赖 `corepack enable`。该镜像内 Node 与 pnpm 自洽（Codespaces 内不存在与宿主混用 ABI 的问题），但会触发 `engines` 告警；升级需同批替换 corepack 引导方式，已登记 [backlog #17](../../plan/backlog.md)。
- **不做双版本 CI 矩阵**：26.x 是本仓唯一支持线，双矩阵会翻倍 CI 成本且不覆盖真实部署形态。
