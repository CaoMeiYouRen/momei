# 系统配置深度解耦与统一化 (System Config Unification)

## 1. 概述 (Overview)

本文档定义了墨梅博客系统配置的深度解耦与统一化方案，旨在实现配置管理的三层加载逻辑、动态热重载能力以及完整的审计追踪。

**核心目标**：
- 解耦 Better-Auth 配置与硬编码环境变量的强绑定
- 实现配置的运行时动态修改与热重载
- 提供完整的配置变更审计日志

## 2. 背景与问题分析

### 2.1 当前问题
1. **Better-Auth 强依赖环境变量**：OAuth Client ID/Secret 等配置在启动时固定，无法动态修改
2. **配置变更无审计**：管理员修改配置后无法追溯历史
3. **热重载缺失**：修改配置需要重启服务才能生效
4. **锁定标识不明确**：用户难以区分哪些配置被环境变量锁定

### 2.2 设计约束
- 必须保持向后兼容，不破坏现有环境变量配置
- 敏感配置（如 `AUTH_SECRET`、`DATABASE_URL`）保持后端私有
- 遵循现有的智能混合配置模式优先级

## 3. 技术方案

### 3.1 三层配置加载器 (Three-Tier Config Loader)

```
┌─────────────────────────────────────────────────────────┐
│                   配置加载优先级                          │
├─────────────────────────────────────────────────────────┤
│  1. ENV (环境变量)          最高优先级，生产锁定         │
│  2. DB (数据库配置)         持久化存储，动态修改         │
│  3. Default (默认值)        代码回退值                  │
└─────────────────────────────────────────────────────────┘
```

**实现位置**: `server/services/setting.ts`

```typescript
/**
 * 三层配置获取
 * @param key 配置键名
 * @param category 配置分类
 * @returns 配置值 (ENV ?? DB ?? Default)
 */
export async function getConfig<T>(
  key: string,
  category: SettingCategory,
  defaultValue?: T
): Promise<T> {
  // 1. 优先检查环境变量
  const envValue = getEnvConfig(key)
  if (envValue !== undefined) {
    return envValue as T
  }

  // 2. 查询数据库配置
  const dbSetting = await Setting.findOne({ where: { key, category } })
  if (dbSetting?.value !== undefined) {
    return dbSetting.value as T
  }

  // 3. 返回默认值
  if (defaultValue !== undefined) {
    return defaultValue
  }

  throw new ConfigError(`Configuration missing: ${key}`)
}
```

### 3.2 Better-Auth 动态配置重构

**问题**: Better-Auth 在初始化时从 `process.env` 读取配置，无法动态更新。

**解决方案**: 创建配置代理层，在认证请求时动态获取配置。

**实现位置**: `lib/auth-client.ts`

```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react'
import { settingService } from '~/server/services/setting'

// 创建带有动态配置的 auth 客户端工厂
export async function createDynamicAuthClient() {
  // 从服务端获取动态配置
  const config = await $fetch('/api/auth/config')

  return createAuthClient({
    baseURL: config.baseUrl,
    baseURL: config.baseURL,
    // ... 其他动态配置
  })
}

// 使用 HMR 兼容的导出
export const authClient = await createDynamicAuthClient()
```

**服务端配置端点**: `server/api/auth/config.get.ts`

```typescript
export default defineEventHandler(async (event) => {
  const config = {
    baseURL: await settingService.get('auth.baseURL'),
    socialProviders: {
      github: {
        clientId: await settingService.get('auth.github.clientId'),
        enabled: await settingService.get('auth.github.enabled'),
      },
      google: {
        clientId: await settingService.get('auth.google.clientId'),
        enabled: await settingService.get('auth.google.enabled'),
      },
      // ... 其他提供商
    },
  }

  return config
})
```

### 3.3 配置热重载机制

**客户端热重载**:
- 使用 Nuxt 的 `useNuxtApp().hook('app:mounted')` 监听配置变更
- 通过 WebSocket 或 SSE 推送配置更新事件
- 自动刷新 `authClient` 实例

**服务端热重载**:
- 配置变更时清除内存缓存
- 使用 Nitro 的 `storage` 层实现缓存失效

### 3.4 配置锁定标识增强

**前端展示**:

```vue
<!-- components/admin/SettingItem.vue -->
<template>
  <div class="setting-item" :class="{ 'is-locked': isLocked }">
    <label>{{ $t(label) }}</label>

    <div class="input-wrapper">
      <InputText
        v-model="localValue"
        :disabled="isLocked"
      />

      <div v-if="isLocked" class="lock-badge">
        <i class="pi pi-lock" />
        <span>{{ $t('admin.settings.locked_by_env') }}</span>
      </div>
    </div>

    <p v-if="description" class="description">
      {{ $t(description) }}
    </p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  key: string
  label: string
  description?: string
}>()

const { getLockedStatus } = useSettingLock()

const isLocked = computed(() => getLockedStatus(props.key))
</script>
```

**后端检测**: `server/composables/useSettingLock.ts`

```typescript
const LOCKED_KEYS = new Set([
  'AUTH_SECRET',
  'DATABASE_URL',
  'REDIS_URL',
  // Better-Auth 暂时锁定的配置
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
])

export function getLockedStatus(key: string): boolean {
  return LOCKED_KEYS.has(key) || process.env[key] !== undefined
}

export function isEnvOverride(key: string): boolean {
  return process.env[key] !== undefined
}
```

## 4. 数据模型设计

### 4.1 Setting 实体扩展

**现有实体**: `server/entities/Setting.ts`

```typescript
@Entity('settings')
export class Setting extends BaseEntity {
  @PrimaryColumn()
  id: string

  @Column({ type: 'enum', enum: SettingCategory })
  category: SettingCategory

  @Column({ type: 'text', nullable: true })
  value: string

  @Column({ type: 'boolean', default: false })
  isSecret: boolean // 是否为敏感配置

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any> // 配置元数据

  @Column({ type: 'boolean', default: true })
  public: boolean // 是否可在前端 UI 中显示

  @Column({ type: 'text', nullable: true })
  translationId: string // 国际化翻译键 ID
}
```

### 4.2 SettingAuditLog 实体 (新增)

**用途**: 追踪配置变更历史

```typescript
// server/entities/SettingAuditLog.ts
import { BaseEntity } from './base'
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './user'

export enum SettingAuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  RELOAD = 'reload', // 热重载事件
}

@Entity('setting_audit_logs')
export class SettingAuditLog extends BaseEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column({ type: 'enum', enum: SettingAuditAction })
  action: SettingAuditAction

  @Column()
  settingKey: string

  @Column({ type: 'enum', enum: SettingCategory })
  category: SettingCategory

  @Column({ type: 'text', nullable: true })
  oldValue: string | null

  @Column({ type: 'text', nullable: true })
  newValue: string | null

  @Column({ type: 'json', nullable: true })
  metadata: {
    reason?: string
    source: 'ui' | 'api' | 'migration'
    ip?: string
    userAgent?: string
  }

  @ManyToOne(() => User)
  @JoinColumn()
  user: User

  @Column()
  userId: string
}
```

## 5. API 接口设计

### 5.1 配置管理 API

| 方法 | 路径 | 描述 |
|:---|:---|:---|
| GET | `/api/admin/settings` | 获取所有配置 (脱敏后) |
| GET | `/api/admin/settings/:category` | 按分类获取配置 |
| PUT | `/api/admin/settings/:key` | 更新单个配置 |
| PUT | `/api/admin/settings/batch` | 批量更新配置 |
| POST | `/api/admin/settings/reload` | 触发热重载 |
| GET | `/api/admin/settings/audit-logs` | 获取审计日志 |

### 5.2 API 响应格式

```typescript
// GET /api/admin/settings
interface SettingsResponse {
  code: number
  data: {
    [category: string]: {
      [key: string]: {
        value: any
        isLocked: boolean
        isSecret: boolean
        translationId: string
        metadata?: Record<string, any>
      }
    }
  }
}

// PUT /api/admin/settings/:key
interface UpdateSettingRequest {
  value: any
  reason?: string // 变更原因，记录到审计日志
}

interface SettingResponse {
  code: number
  data: {
    key: string
    value: any
    isLocked: boolean
  }
}
```

## 6. 前端组件设计

### 6.1 系统设置页面

**路径**: `pages/admin/settings.vue`

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'admin',
})

const { t } = useI18n()
const { data: settings, refresh } = await useFetch('/api/admin/settings')
const { updateSetting, isUpdating } = useSettingUpdate()

const activeCategory = ref('general')

const categories = [
  { id: 'general', label: 'admin.settings.categories.general' },
  { id: 'auth', label: 'admin.settings.categories.auth' },
  { id: 'ai', label: 'admin.settings.categories.ai' },
  { id: 'email', label: 'admin.settings.categories.email' },
]

async function handleUpdate(key: string, value: any) {
  const reason = prompt(t('admin.settings.update_reason'))
  await updateSetting(key, value, reason)
  await refresh()
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-layout">
      <!-- 侧边栏分类导航 -->
      <div class="settings-sidebar">
        <h2>{{ t('admin.settings.title') }}</h2>
        <nav>
          <button
            v-for="cat in categories"
            :key="cat.id"
            :class="{ active: activeCategory === cat.id }"
            @click="activeCategory = cat.id"
          >
            {{ t(cat.label) }}
          </button>
        </nav>
      </div>

      <!-- 配置面板 -->
      <div class="settings-content">
        <AdminSettingCategory
          v-if="settings"
          :category="activeCategory"
          :settings="settings[activeCategory]"
          @update="handleUpdate"
        />
      </div>
    </div>

    <!-- 审计日志面板 -->
    <AdminSettingAuditLogs :category="activeCategory" />
  </div>
</template>
```

### 6.2 配置审计日志组件

**路径**: `components/admin/AdminSettingAuditLogs.vue`

```vue
<script setup lang="ts">
const props = defineProps<{
  category?: string
}>()

const { data: logs, pending } = await useFetch(() => {
  const query = props.category ? { category: props.category } : {}
  return `/api/admin/settings/audit-logs?${new URLSearchParams(query)}`
})

function getActionIcon(action: SettingAuditAction) {
  switch (action) {
    case SettingAuditAction.CREATE:
      return 'pi pi-plus'
    case SettingAuditAction.UPDATE:
      return 'pi pi-pencil'
    case SettingAuditAction.DELETE:
      return 'pi pi-trash'
    case SettingAuditAction.RELOAD:
      return 'pi pi-refresh'
  }
}
</script>

<template>
  <div class="audit-logs">
    <h3>{{ $t('admin.settings.audit_logs') }}</h3>

    <DataTable
      :value="logs"
      :loading="pending"
      paginator
      :rows="10"
    >
      <Column field="createdAt" :header="$t('admin.settings.timestamp')">
        <template #body="{ data }">
          {{ formatDate(data.createdAt) }}
        </template>
      </Column>

      <Column field="action" :header="$t('admin.settings.action')">
        <template #body="{ data }">
          <i :class="getActionIcon(data.action)" />
        </template>
      </Column>

      <Column field="settingKey" :header="$t('admin.settings.key')" />

      <Column field="user.username" :header="$t('admin.settings.user')" />

      <Column field="metadata.reason" :header="$t('admin.settings.reason')" />
    </DataTable>
  </div>
</template>
```

## 7. 安全考虑

### 7.1 敏感配置保护
- **前端脱敏**: API 响应对 `isSecret: true` 的配置返回 `******`
- **后端隔离**: 极端敏感配置（`AUTH_SECRET`、`DATABASE_URL`）完全不进入 UI
- **权限控制**: 仅管理员可访问配置 API

### 7.2 变更审计
- 记录所有配置变更操作
- 包含操作用户、IP、时间戳、变更原因
- 支持按时间、用户、配置键筛选

### 7.3 热重载安全
- 配置重载前验证新配置有效性
- 失败时回滚到上一个稳定状态
- 关键配置变更要求管理员二次确认

## 8. 实施计划

### Phase 1: 三层加载器 (Week 1)
- [ ] 扩展 `SettingService` 实现三层加载逻辑
- [ ] 添加配置锁定检测方法
- [ ] 编写单元测试

### Phase 2: Better-Auth 动态化 (Week 2)
- [ ] 创建配置代理层
- [ ] 实现 `/api/auth/config` 端点
- [ ] 重构 `lib/auth-client.ts` 支持动态加载
- [ ] 测试 OAuth 登录流程

### Phase 3: 审计日志 (Week 3)
- [ ] 创建 `SettingAuditLog` 实体
- [ ] 实现审计日志记录服务
- [ ] 开发审计日志查询 API
- [ ] 创建前端审计日志组件

### Phase 4: UI 增强 (Week 4)
- [ ] 实现配置锁定标识
- [ ] 添加配置变更确认对话框
- [ ] 实现热重载通知
- [ ] E2E 测试

## 9. 相关文档

- [系统模块设计](./system.md)
- [认证模块设计](./auth.md)
- [API 设计规范](../api.md)
- [安全规范](../../standards/security.md)
