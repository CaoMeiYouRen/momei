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

> 阶段状态: 第三十一、第三十二阶段已完成审计归档。第三十三阶段正式上收，继续将测试覆盖率推进至 `80%+`（冲刺目标）。`存量代码注释治理与注释漂移收敛` 已正式上收为候选组 B 切片。

> 当前进行中: 第三十三阶段 —「1 个新功能 + 4 个优化」。新功能：创作者数据统计增强；优化：coverage `80%+` 冲刺、ESLint `composables` 子桶继续收紧、重复代码认证页模板收敛、注释治理候选组 B。

### 第三十三阶段：创作者统计与质量冲刺

- [ ] **创作者数据统计增强 (P1)**
	- 前置: 进入实现前，先在 `docs/design/governance/` 下冻结首版指标集合、权限口径与归因来源三项结论。
	- 范围: 后台 `/admin` 增加「创作者统计」tab，提供发文趋势图 + 分发效果卡片（WechatSync / 远程仓库同步成功率）。新增 `GET /api/admin/creator-stats`（`?range=` + `?authorId=`）。
	- 非目标: 不做全站 BI、不做来源归因、不做订阅漏斗、不新增加埋点。
	- 验证: 定向测试覆盖空数据、时间范围切换、权限隔离；浏览器 UI 截图。

- [ ] **测试覆盖率冲刺 80%+ (P0)**
	- 范围: 从 `~76%+` 基线继续提升，优先认证流边角分支、raw key 暴露、热点公开读链路失败路径、新增 creator-stats API 的失败断言。
	- 收口线: `>= 78%`（`80%+` 为冲刺目标）。

- [ ] **ESLint / 类型债 composables 子桶继续收紧 (P1)**
	- 范围: 继续锁定 `@typescript-eslint/no-non-null-assertion` 在 `composables/` 的下一组命中点。
	- 回退: 若命中点过少，回退为单文件 `no-explicit-any` 切片。

- [ ] **重复代码 — 公开认证页模板收敛 (P1)**
	- 范围: `forgot-password.vue` vs `reset-password.vue` 的公共模板片段与表单逻辑下沉。
	- 基线: `pnpm duplicate-code:check` 不反弹（当前 `32 clones / 0.59%`）。

- [ ] **存量代码注释治理 — 候选组 B (P1)**
	- 范围: `server/services/upload.ts` + `server/utils/post-access.ts` 两条安全敏感链路。
	- 同步清理失效旧注释，完成 Review Gate 复核。

## 相关文档

- [AI 代理配置](../../AGENTS.md)
- [项目计划](./roadmap.md)
- [开发规范](../standards/development.md)
- [性能规范](../standards/performance.md)
- [UI 设计](../design/ui.md)
- [API 设计](../design/api.md)
- [测试规范](../standards/testing.md)

