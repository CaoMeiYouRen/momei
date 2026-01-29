# 主题画廊系统 (Theme Gallery System)

## 1. 概述 (Overview)

主题画廊系统允许管理员在“自定义”主题的基础上，保存并命名多套独立的配置方案（配置集）。通过画廊界面，管理员可以直观地预览、切换或删除已保存的方案，从而实现博客视觉风格的快速迭代与管理。

## 2. 设计目标 (Design Goals)

-   **配置持久化**: 允许保存多套个性化配色、圆角、背景等参数。
-   **可视化预览**: 提供缩略图和描述，帮助管理员快速识别不同方案。
-   **无损切换**: 切换方案不影响现有的自定义预设数据（作为备份），应用方案后更新全局生效配置。
-   **临时性预览**: 支持在保存或应用前，仅对当前会话进行视觉预览，不影响访客。

## 3. 核心功能 (Core Features)

### 3.1 方案管理 (Gallery Management)
-   **保存为新方案**: 捕捉当前自定义模式下的所有样式参数，并要求输入名称和描述。
-   **方案列表展示**: 以卡片形式展示所有保存的主题，包含预览图、名称和操作按钮。
-   **应用方案**: 将选定的方案参数覆盖到系统当前的“生效配置”中。
-   **删除方案**: 移除不再需要的配置集。

### 3.2 智能预览 (Smart Preview)
-   **前端预览生成**: 使用浏览器的绘图能力（如 `html2canvas` 或简化版的 CSS 快照渲染）生成当前页面的缩略图 Base64 字符串，存储在数据库中。
-   **临时会话预览**: 支持通过 Query 参数（如 `?preview_theme_id=xxx`）或前端注入的方式，在管理员浏览器中实时应用尚未正式发布的配置。

## 4. 技术实现 (Technical Implementation)

### 4.1 数据库方案 (Database)

新增实体 `ThemeConfig`:

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | `string` (UUID) | 唯一标识符 |
| `name` | `string` | 方案名称 (如 "2024 春季限定") |
| `description` | `text` | 方案描述 |
| `configData` | `json` | 具体的样式参数集 (primaryColor, borderRadius, customCss 等) |
| `previewImage` | `mediumtext` | 前端生成的缩略图 (Base64) 或存储路径 |
| `isSystem` | `boolean` | 是否为系统内置导出的模板 (只读标识) |
| `createdAt` | `datetime` | 创建时间 |
| `updatedAt` | `datetime` | 更新时间 |

### 4.2 API 设计 (API Design)

| 路由 | 方法 | 权限 | 说明 |
| :--- | :--- | :--- | :--- |
| `/api/admin/theme-configs` | `GET` | `admin` | 获取所有保存的方案列表 |
| `/api/admin/theme-configs` | `POST` | `admin` | 保存当前配置为新方案 |
| `/api/admin/theme-configs/:id` | `PUT` | `admin` | 更新方案名称、描述或覆盖配置 |
| `/api/admin/theme-configs/:id` | `DELETE` | `admin` | 删除指定方案 |
| `/api/admin/theme-configs/:id/apply` | `POST` | `admin` | 将该方案应用为当前全站生效配置 |

### 4.3 前端实现逻辑 (Frontend Logic)

1.  **快照生成**:
    -   在点击“保存”时，调用前端脚本渲染一个迷你的博客结构预览图。
    -   将该图作为 `previewImage` 发送到后端。
2.  **临时预览**:
    -   管理员点击画廊卡片上的“预览”按钮时，将方案数据注入到 `useTheme` 的 `previewState` 中。
    -   `useTheme` 钩子由于响应式特性，会立即更新 CSS 变量，使页面呈现新效果。
    -   不触发后端全局配置更新，直到点击“确定应用”。

## 5. 验收标准 (Acceptance Criteria)

-   [ ] 管理员可以保存当前的颜色、圆角等设置并赋予其唯一的名称。
-   [ ] 保存时自动生成配置的缩略图并显示在画廊中。
-   [ ] 点击“应用”后，方案参数确切同步到 `Settings` 表并全站生效。
-   [ ] 提供“临时预览”模式，允许管理员在不刷新/不影响访客的情况下查看效果。
-   [ ] 能够删除自定义方案，系统内置方案（如有）不可删除。

## 6. 相关文档

-   [主题系统设计](./theme-system.md)
-   [系统设置设计](./system-settings.md)
