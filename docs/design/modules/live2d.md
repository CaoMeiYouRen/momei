# 看板娘系统设计文档 (Live2D)

## 1. 概述 (Overview)

看板娘系统用于为站点提供可选的虚拟角色陪伴能力。该能力默认遵循“性能优先、可控启用”的原则：

- 默认不强制加载，只有启用后才注入运行时脚本。
- 在移动端、窄屏和省流量场景自动降级为不加载。
- 通过异步与空闲时机加载，减少对首屏渲染的干扰。

当前实现基于 `live2d-widgets@1.0.0`，资源默认从 `https://unpkg.com/` 拉取。

## 2. 设计目标 (Goals)

1. **可选加载**：支持后台开关，未启用时不请求 Live2D 资源。
2. **性能保护**：移动端/窄屏/省流量场景默认禁用。
3. **异步接入**：使用空闲调度或延迟调度，避免阻塞首屏。
4. **可配置来源**：支持 CDN 脚本地址与模型地址配置（含自定义 URL）。

## 3. 配置模型 (Settings)

通过系统设置（`Setting`）管理以下键值：

- `live2d_enabled`: 是否启用 Live2D。
- `live2d_script_url`: Live2D 资源根路径（推荐以 `/dist/` 结尾）。
- `live2d_model_url`: `waifu-tips.json` 的 URL。
- `live2d_options_json`: `initWidget` 的高级覆盖配置（JSON 字符串）。
- `live2d_mobile_enabled`: 是否允许在移动端/窄屏加载。
- `live2d_min_width`: 最小加载宽度阈值（像素）。
- `live2d_data_saver_block`: 在省流量网络下是否强制禁用。

`live2d_options_json` 支持覆盖的配置项（与上游文档对齐）：

- `waifuPath`
- `cdnPath`
- `cubism2Path`
- `cubism5Path`
- `modelId`
- `tools`
- `drag`
- `logLevel`（`error` / `warn` / `info` / `trace`）

对应环境变量建议：

- `NUXT_PUBLIC_LIVE2D_ENABLED`
- `NUXT_PUBLIC_LIVE2D_SCRIPT_URL`
- `NUXT_PUBLIC_LIVE2D_MODEL_URL`
- `NUXT_PUBLIC_LIVE2D_MOBILE_ENABLED`
- `NUXT_PUBLIC_LIVE2D_MIN_WIDTH`
- `NUXT_PUBLIC_LIVE2D_DATA_SAVER_BLOCK`

## 4. 运行时策略 (Runtime Strategy)

### 4.1 启用前置判断

满足以下任一条件时，不加载 Live2D：

- `live2d_enabled` 未开启。
- 当前视口宽度小于 `live2d_min_width`。
- 设备为移动端且 `live2d_mobile_enabled` 为 `false`。
- `navigator.connection.saveData === true` 且 `live2d_data_saver_block === true`。
- `navigator.connection.effectiveType` 为 `slow-2g` / `2g`（可扩展到 `3g`）。

### 4.2 异步加载顺序

1. 页面挂载后执行启用判断。
2. 若允许加载，优先使用 `requestIdleCallback`，否则回退 `setTimeout` 延迟。
3. 通过封装方法异步加载 `waifu.css` 与 `waifu-tips.js`（`type=module`）。
4. 调用 `initWidget` 完成挂载（`waifuPath/cubism2Path/cubism5Path`）。

### 4.3 错误处理

- 脚本加载失败不抛出阻塞异常，仅输出告警日志。
- 模型地址异常时静默降级，不影响主页面功能。

## 5. 前端结构 (Frontend Integration)

- 新增客户端组件：`components/live2d-widget.vue`。
- 在默认布局中以懒加载方式挂载：`<LazyLive2dWidget />`。
- 使用已有 `useMomeiConfig` 的公开配置数据，不新增独立请求。
- 在运行时对 `window.Image` 进行跨域兜底封装，降低贴图跨域导致的加载失败概率。

默认推荐配置示例：

- `live2d_script_url`: `https://unpkg.com/live2d-widgets@1.0.0/dist/`
- `live2d_model_url`: `https://unpkg.com/live2d-widgets@1.0.0/dist/waifu-tips.json`

## 6. 验收标准 (Acceptance Criteria)

- 未开启开关时，页面不发起 Live2D 脚本与模型请求。
- 开启后仅在满足设备与网络条件时加载。
- 手机端（或小宽度）默认不加载。
- 可通过后台修改脚本/模型地址并即时生效（刷新后）。
- 首屏性能无明显回退（Live2D 脚本不在关键渲染路径执行）。
