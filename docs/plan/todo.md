# 墨梅博客 待办事项 (Todo List)

本文档列出了当前阶段需要完成的具体任务。所有任务应围绕 [项目计划](./roadmap.md) 展开，并遵循 [项目规划规范](../standards/planning.md) 进行评估与执行。

**历史任务归档**: [待办事项归档](./todo-archive.md)

> **说明**: 长期规划与积压项已统一迁移至 [backlog.md](./backlog.md) 文档。
> 待办事项 (Todo) 仅包含当前阶段的具体实施任务，新功能需求请直接在 [backlog.md](./backlog.md) 中添加。

## 状态说明

- [ ] 待办 (Todo)
- [x] 已完成 (Done)
- [-] 已取消 (Cancelled)

---

## 当前待办
> 开始进行待办时，在本区域填写正在进行的待办，结束后清理并更新对应条目状态。

当前进行中事项
- 首屏性能阶段一优化（Lighthouse >= 50）：已启动首轮实现，当前聚焦首页非关键数据延后加载与前台 Markdown / PrimeVue 体积收缩，待继续补齐 Lighthouse 基线与收益记录。

> 阶段状态: 第二十六阶段已完成归档，第二十七阶段已进入执行中；本文件从候选分析切换为第二十七阶段执行面。

### 第二十七阶段：渠道稳定性与体验性能推进 (执行中)

1. [ ] **渠道分发回归加固（含 RSS 防回归补测）** (P0)
	- 验收: WechatSync 在微博 / 小红书链路完成根因收敛与修复，不破坏既有成功平台。
	- 验收: 已确认修复的 RSS 路由补齐定向测试（taxonomy 排序 / feed 路由 / 发现链路），避免同类问题再次出现。
	- 验收: 至少保留一轮定向测试与联调证据。

2. [ ] **文章页一键分享与图标系统修复** (P1)
	- 验收: 文章页提供统一分享入口，覆盖主流平台并保证移动端可用。
	- 验收: 社交 / 打赏图标映射统一，新增第三方图标库与 fallback 策略。

3. [x] **接口缓存逻辑复用与可缓存接口扩面切片** (P1)
	- 验收: 抽离缓存复用层（TTL / 失效 / 键策略 / 权限边界），减少重复实现。
	- 验收: 输出一组高收益接口扩面清单并完成至少 1 组落地验证。
	- 结果: 已统一接入 `settings/public`、`friend-links/index`、`posts/archive`、`categories/index`、`tags/index`，并补齐缓存清单与回归证据，见 [cacheable-api-inventory.md](./cacheable-api-inventory.md) 与 [regression-log.md](./regression-log.md)。

4. [ ] **首屏性能阶段一优化（Lighthouse >= 50）** (P0)
	- 验收: 建立当前瓶颈分解与采样口径，核心页面性能评分稳定达到 >= 50。
	- 验收: 沉淀“措施 - 收益 - 副作用”记录，作为后续冲刺 >= 90 的基线。

5. [ ] **E2E 覆盖矩阵第一轮** (P1)
	- 验收: 建立页面与接口覆盖矩阵并明确优先级。
	- 验收: 完成关键交易路径与高风险接口的首轮稳定用例。


## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

