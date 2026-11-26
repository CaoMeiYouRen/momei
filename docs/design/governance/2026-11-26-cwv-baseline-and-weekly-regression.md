# CWV 基线采集与周回归接入（2026-11-26）

## 1. 目标与增量

第八十六阶段条目 86.4.1 的目标是让公开页 Core Web Vitals（LCP / CLS / TBT）成为**可复跑、可周期回归**的量化基线：

- 复用既有 `pnpm test:perf:cwv`（`scripts/perf/cwv-baseline.mjs`），覆盖首页 / 文章详情 / 分类 / 标签 / 归档 5 条路由；
- 在 `regression-weekly.yml` 以 warning 面接入，失败不阻断周回归，只提供趋势；
- 与第五十二阶段一次性移动 CWV 评估的增量是 roadmap 定义的「CI 可复跑 + weekly 接入」，不是重复采集。第五十二阶段为移动形态、采集方式不同，其 LCP 1.6–2.2s 与本次 desktop 3.9–4.5s 不可直接对比；INP 未复现，移动形态需另立基线。

## 2. 采集环境

| 项 | 值 |
| :--- | :--- |
| 模式 | `--mode=prod`（`.output/server` 生产构建） |
| 形态 | desktop，无节流（脚本默认） |
| 采样 | 每路由 3 次取中位数 |
| 本机 | Linux，Chromium 1234（Playwright 缓存） |
| 环境变量 | `TEST_MODE=true`、`NUXT_PUBLIC_TEST_MODE=true`（无安装态下让 `/tags` 正常渲染） |
| 运行日期 | 2026-11-26 |

> `TEST_MODE` 是本机与 CI 无持久化安装态时的必要环境差异，会带来演示数据态；与真实生产数据量存在差异，作为趋势基线使用，不作绝对值承诺。移动形态与 INP 未覆盖：`performance.md` 现有口径以 LCP / CLS / TBT 为准，INP 未在本脚本产出，如实登记为扩展评估项。

## 3. 基线结果（第二次运行）

| 路由 | LCP | CLS | TBT | 两次 LCP 波动 | Performance |
| :--- | ---: | ---: | ---: | ---: | ---: |
| `home` | 3922 ms | 0.1419 | 0 ms | 0.09% | 55 |
| `article-detail` | 4519 ms | 0.0001 | 0 ms | 0.14% | 59 |
| `categories` | 3918 ms | 0.0001 | 0 ms | 0.05% | 61 |
| `tags` | 3926 ms | 0.0001 | 6.5 ms | 0.12% | 61 |
| `archives` | 3922 ms | 0.0054 | 0 ms | 0.01% | 61 |

连续两次运行 LCP 波动均 ≤0.14%，CLS 完全一致，满足「波动 ≤10% 或记录环境差异」的验收口径。TBT 两次中位数在 0–10 ms 区间跳动，相对波动可达 100% 但绝对值极小；按**绝对容差 ≤20ms** 判定为同一量级，不按相对波动比较。

判定：`home` 的 LCP 3.92s、CLS 0.1419 均处于 needs-improvement；其余路由 LCP 亦在 3.9–4.5s。基线记录到此为止，优化不在本条范围（阶段不做范围明确排除）。

## 4. 周回归接入

`regression-weekly.yml` 在 `Nuxt build` 之后新增：

```yaml
- name: CWV baseline (warning)
  if: always()
  continue-on-error: true
  env:
    TEST_MODE: "true"
    NUXT_PUBLIC_TEST_MODE: "true"
  run: pnpm run test:perf:cwv -- --mode=prod --runs=3
```

产物 `.lighthouseci/cwv-baseline.json` 以独立 artifact `cwv-baseline-<run_id>` 上传，避免多路径合并改变既有周回归 artifact 的目录根；步骤失败不阻断周回归，仅记录趋势。全部路由采集失败时脚本以非零退出暴露问题（步骤仍 `continue-on-error`，但运行结论可见）。

## 5. 脚本修复

`scripts/perf/cwv-baseline.mjs` 两处环境缺陷在本条一并修复：

1. lhci CLI 路径原硬编码 `@lhci/cli@0.15.1`，依赖升级到 0.16.1 后 `test:perf:cwv` 直接 `MODULE_NOT_FOUND`；改为经 `node_modules/@lhci/cli` 顶层软链解析。
2. `--settings.chromeFlags` 经 `shell: true` 传递时空格未分组，`--no-sandbox` 被拆成独立参数，root 环境 Chrome 直接拒绝启动；根因修复为 `spawn(process.execPath, [cliPath, ...args])`（`shell: false`，数组天然分组），并补 `--disable-dev-shm-usage`。移动节流的 `1.6 * 1024` 也从 shell 表达式改为 JS 计算后的数值，恢复 mobile 形态可用性。

## 6. 未覆盖边界

- 移动形态、INP 未采集；需要时按 `--form-factor=mobile` 另立基线，不修改本口径。
- 本机 Chromium 版本与 CI runner Chrome 不同，绝对值会有环境差异；周回归只看趋势。
- `TEST_MODE` 演示数据态与真实生产数据量不同，LCP 中的内容密度可能偏差。
