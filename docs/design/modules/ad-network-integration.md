# 商业化与广告联盟集成 (Commercial & Ad Networks)

## 1. 概述 (Overview)

本文档定义了墨梅博客的广告联盟集成与商业内容管理方案，支持多平台广告接入、智能投放策略和外链安全管理。

**核心目标**：
- 接入主流广告联盟（Google AdSense、百度、腾讯等）
- 实现灵活的广告占位符系统（全局/分类/标签级）
- 提供外链安全过滤与跳转追踪

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                        广告系统架构                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐     │
│  │ Ad Platform  │      │ Ad Placement │      │   Content    │     │
│  │  Adapters    │─────▶│    Manager   │─────▶│  Injection   │     │
│  └──────────────┘      └──────────────┘      └──────────────┘     │
│         │                      │                      │            │
│         │                      ▼                      │            │
│         │              ┌──────────────┐              │            │
│         │              │   Campaign   │              │            │
│         │              │   Manager    │              │            │
│         │              └──────────────┘              │            │
│         │                      │                      │            │
│         ▼                      ▼                      ▼            │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                     External Links Gate                      │  │
│  │                  (Redirect Gate + Analytics)                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. 多平台广告适配器

### 3.1 支持的广告平台

| 平台 | 地区 | 广告类型 | 状态 |
|:---|:---|:---|:---|
| **Google AdSense** | 全球 | 自动广告、手动广告 | P1 |
| **百度联盟** | 中国 | 展示广告 | P1 |
| **腾讯广告** | 中国 | 展示广告 | P1 |
| **字节跳动** | 中国 | 原生广告 | P2 |

### 3.2 广告适配器接口

**位置**: `server/services/adapters/`

```typescript
// server/services/adapters/base.ts
export interface AdAdapter {
  readonly id: string
  readonly name: string
  readonly supportedLocales: string[]

  // 初始化适配器
  initialize(config: Record<string, any>): Promise<void>

  // 验证凭据
  verifyCredentials(): Promise<boolean>

  // 获取广告脚本
  getScript(): string

  // 获取广告位 HTML
  getPlacementHtml(placement: AdPlacement): string

  // 回调处理（验证、通知等）
  handleCallback(event: H3Event): Promise<void>
}
```

### 3.3 Google AdSense 适配器

```typescript
// server/services/adapters/adsense.ts
import { BaseAdapter } from './base'

export class AdSenseAdapter extends BaseAdapter {
  id = 'adsense'
  name = 'Google AdSense'
  supportedLocales = ['*'] // 支持所有地区

  async initialize(config: { clientId: string }) {
    if (!config.clientId) {
      throw new AdError('AdSense Client ID is required')
    }
    this.config = config
  }

  getScript(): string {
    return `
      <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${this.config.clientId}"
              crossorigin="anonymous"></script>
    `
  }

  getPlacementHtml(placement: AdPlacement): string {
    const { slot, format } = placement.metadata

    return `
      <ins class="adsbygoogle"
           style="display:${format === 'responsive' ? 'block' : 'inline-block'}"
           data-ad-client="${this.config.clientId}"
           data-ad-slot="${slot}"
           data-ad-format="${format}"
           data-full-width-responsive="true"></ins>
      <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
    `
  }
}
```

### 3.4 百度联盟适配器

```typescript
// server/services/adapters/baidu.ts
export class BaiduAdapter extends BaseAdapter {
  id = 'baidu'
  name = '百度联盟'
  supportedLocales = ['zh-CN']

  getScript(): string {
    return `
      <script src="https://cpro.baidustatic.com/cpro/ui/c.js"></script>
    `
  }

  getPlacementHtml(placement: AdPlacement): string {
    const { slotId, width, height } = placement.metadata

    return `
      <script>
        var cpro_id = "${slotId}";
        var cpro_w = "${width}";
        var cpro_h = "${height}";
      </script>
      <script src="https://cpro.baidustatic.com/cpro/ui/c.js"></script>
    `
  }
}
```

## 4. 数据模型设计

### 4.1 AdPlacement 实体

**用途**: 定义广告位配置

```typescript
// server/entities/AdPlacement.ts
import { BaseEntity } from './base'
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm'

export enum AdFormat {
  DISPLAY = 'display',        // 展示广告
  NATIVE = 'native',          // 原生广告
  VIDEO = 'video',            // 视频广告
  RESPONSIVE = 'responsive',  // 响应式广告
}

export enum AdLocation {
  HEADER = 'header',          // 页眉
  SIDEBAR = 'sidebar',        // 侧边栏
  CONTENT_TOP = 'content_top',    // 内容顶部
 _CONTENT_MIDDLE = 'content_middle', // 内容中部
  CONTENT_BOTTOM = 'content_bottom', // 内容底部
  FOOTER = 'footer',          // 页脚
}

@Entity('ad_placements')
export class AdPlacement extends BaseEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column()
  name: string // 广告位名称

  @Column({ type: 'enum', enum: AdFormat })
  format: AdFormat

  @Column({ type: 'enum', enum: AdLocation })
  location: AdLocation

  @Column()
  adapterId: string // 使用的适配器 ID

  @Column({ type: 'json' })
  metadata: {
    // Google AdSense
    slot?: string
    // 百度联盟
    slotId?: string
    width?: number
    height?: number
    // 通用
    responsive?: boolean
  }

  @Column({ type: 'boolean', default: true })
  enabled: boolean

  // 投放规则
  @Column({ type: 'json', nullable: true })
  targeting: {
    categories?: string[]    // 仅在指定分类显示
    tags?: string[]          // 仅在指定标签显示
    locales?: string[]       // 仅在指定语言显示
    maxViewsPerSession?: number // 会话内最大展示次数
  }

  @Column({ type: 'int', default: 0 })
  priority: number // 优先级，数字越大越优先

  @Column({ type: 'text', nullable: true })
  customCss: string // 自定义样式

  @ManyToOne(() => AdCampaign, { nullable: true })
  @JoinColumn()
  campaign: AdCampaign | null
}
```

### 4.2 AdCampaign 实体

**用途**: 广告活动管理

```typescript
// server/entities/AdCampaign.ts
import { BaseEntity } from './base'
import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm'

export enum CampaignStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
}

@Entity('ad_campaigns')
export class AdCampaign extends BaseEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column()
  name: string // 活动名称

  @Column({ type: 'enum', enum: CampaignStatus, default: CampaignStatus.DRAFT })
  status: CampaignStatus

  @Column({ type: 'timestamp', nullable: true })
  startDate: Date | null

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date | null

  @Column({ type: 'json', nullable: true })
  targeting: {
    categories?: string[]
    tags?: string[]
    locales?: string[]
  }

  @Column({ type: 'int', default: 0 })
  impressions: number // 展示次数

  @Column({ type: 'int', default: 0 })
  clicks: number // 点击次数

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  revenue: number // 收益

  @OneToMany(() => AdPlacement, placement => placement.campaign)
  placements: AdPlacement[]
}
```

### 4.3 ExternalLink 实体

**用途**: 外链管理与追踪

```typescript
// server/entities/ExternalLink.ts
import { BaseEntity } from './base'
import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { User } from './user'

export enum LinkStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  EXPIRED = 'expired',
}

@Entity('external_links')
export class ExternalLink extends BaseEntity {
  @PrimaryColumn('uuid')
  id: string

  @Column()
  originalUrl: string // 原始 URL

  @Column({ unique: true })
  shortCode: string // 短码 (用于跳转链接)

  @Column({ type: 'enum', enum: LinkStatus, default: LinkStatus.ACTIVE })
  status: LinkStatus

  @Column({ type: 'boolean', default: false })
  noFollow: boolean // 是否添加 nofollow

  @Column({ type: 'boolean', default: true })
  showRedirectPage: boolean // 是否显示跳转页

  @Column({ type: 'int', default: 0 })
  clickCount: number // 点击次数

  @Column({ type: 'json', nullable: true })
  metadata: {
    source?: 'post' | 'comment' | 'page' // 来源
    sourceId?: string
    title?: string // 链接标题
    description?: string // 链接描述
    favicon?: string // 网站图标
  }

  @ManyToOne(() => User)
  @JoinColumn()
  createdBy: User

  @Column()
  createdById: string
}
```

## 5. API 接口设计

### 5.1 广告管理 API

| 方法 | 路径 | 描述 |
|:---|:---|:---|
| GET | `/api/admin/ad/placements` | 获取广告位列表 |
| POST | `/api/admin/ad/placements` | 创建广告位 |
| PUT | `/api/admin/ad/placements/:id` | 更新广告位 |
| DELETE | `/api/admin/ad/placements/:id` | 删除广告位 |
| GET | `/api/admin/ad/campaigns` | 获取广告活动列表 |
| POST | `/api/admin/ad/campaigns` | 创建广告活动 |
| PUT | `/api/admin/ad/campaigns/:id` | 更新广告活动 |

### 5.2 外链管理 API

| 方法 | 路径 | 描述 |
|:---|:---|:---|
| POST | `/api/admin/external-links` | 创建短链接 |
| GET | `/api/admin/external-links` | 获取外链列表 |
| GET | `/api/admin/external-links/stats/:id` | 获取链接统计 |
| PUT | `/api/admin/external-links/:id/status` | 更新链接状态 |
| GET | `/api/goto/:code` | 跳转端点 |

### 5.3 广告投放 API

| 方法 | 路径 | 描述 |
|:---|:---|:---|
| GET | `/api/ads/placements` | 获取当前页面的广告位配置 |
| GET | `/api/ads/script` | 获取广告脚本 |

## 6. 前端组件设计

### 6.1 广告位组件

```vue
<!-- components/ads/AdPlacement.vue -->
<script setup lang="ts">
const props = defineProps<{
  location: AdLocation
  context?: {
    postId?: string
    categories?: string[]
    tags?: string[]
  }
}>()

const { data: placement } = await useFetch(() => {
  const params = {
    location: props.location,
    ...props.context,
  }
  return `/api/ads/placements?${new URLSearchParams(params)}`
})

const { locale } = useI18n()

// 检查是否应该展示
const shouldShow = computed(() => {
  if (!placement.value) return false
  if (!placement.value.enabled) return false

  // 检查语言定向
  if (placement.value.targeting?.locales) {
    return placement.value.targeting.locales.includes(locale.value)
  }

  return true
})
</script>

<template>
  <div v-if="shouldShow" class="ad-placement" :class="`ad-${location}`">
    <div class="ad-label">{{ $t('common.advertisement') }}</div>
    <div
      v-html="placement.html"
      class="ad-content"
      :data-ad-slot="placement.metadata.slot"
    />
  </div>
</template>

<style scoped lang="scss">
.ad-placement {
  margin: 2rem 0;
  text-align: center;

  .ad-label {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    margin-bottom: 0.5rem;
  }

  :deep(.ad-content) {
    min-height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
```

### 6.2 外链跳转页

```vue
<!-- pages/goto/[code].vue -->
<script setup lang="ts">
const route = useRoute()
const code = route.params.code as string

const { data, pending, error } = await useFetch(`/api/goto/${code}`)

// 自动跳转
onMounted(() => {
  if (data.value?.url) {
    setTimeout(() => {
      window.location.href = data.value.url
    }, 3000) // 3秒后跳转
  }
})

const countdown = ref(3)
const timer = setInterval(() => {
  countdown.value--
  if (countdown.value <= 0) {
    clearInterval(timer)
  }
}, 1000)
</script>

<template>
  <div class="redirect-gate">
    <div v-if="pending" class="loading">
      <ProgressSpinner />
      <p>{{ $t('redirect.loading') }}</p>
    </div>

    <div v-else-if="error" class="error">
      <i class="pi pi-exclamation-triangle" />
      <h2>{{ $t('redirect.error.title') }}</h2>
      <p>{{ $t('redirect.error.message') }}</p>
    </div>

    <div v-else-if="data" class="redirect-info">
      <div class="icon">
        <i class="pi pi-external-link" />
      </div>

      <h2>{{ $t('redirect.leaving_site') }}</h2>

      <div class="target-info">
        <img
          v-if="data.favicon"
          :src="data.favicon"
          class="favicon"
          alt=""
        />
        <span class="url">{{ data.url }}</span>
      </div>

      <div class="countdown">
        {{ $t('redirect.auto_continue', { seconds: countdown }) }}
      </div>

      <div class="actions">
        <Button
          :label="$t('redirect.continue_now')"
          @click="window.location.href = data.url"
        />
        <Button
          :label="$t('redirect.cancel')"
          severity="secondary"
          @click="$router.back()"
        />
      </div>

      <p class="disclaimer">
        {{ $t('redirect.disclaimer') }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.redirect-gate {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;

  .redirect-info {
    text-align: center;
    max-width: 500px;

    .icon {
      font-size: 3rem;
      color: var(--primary-color);
      margin-bottom: 1rem;
    }

    .target-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--surface-ground);
      border-radius: var(--border-radius);
      margin: 1.5rem 0;

      .favicon {
        width: 1.5rem;
        height: 1.5rem;
      }

      .url {
        font-family: monospace;
        word-break: break-all;
      }
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin: 2rem 0;
    }

    .disclaimer {
      font-size: 0.875rem;
      color: var(--text-color-secondary);
    }
  }
}
</style>
```

### 6.3 广告管理界面

```vue
<!-- pages/admin/ad/placements.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
  layout: 'admin',
})

const { data: placements, refresh } = await useFetch('/api/admin/ad/placements')
const { create, update, remove, isPending } = useAdPlacement()

const dialog = ref({
  visible: false,
  mode: 'create' as 'create' | 'edit',
  data: null as AdPlacement | null,
})

function openCreateDialog() {
  dialog.value = {
    visible: true,
    mode: 'create',
    data: null,
  }
}

function openEditDialog(placement: AdPlacement) {
  dialog.value = {
    visible: true,
    mode: 'edit',
    data: placement,
  }
}

async function handleSave(formData: Partial<AdPlacement>) {
  if (dialog.value.mode === 'create') {
    await create(formData)
  } else {
    await update(dialog.value.data!.id, formData)
  }
  dialog.value.visible = false
  await refresh()
}

async function handleDelete(id: string) {
  if (confirm('确定要删除此广告位吗？')) {
    await remove(id)
    await refresh()
  }
}
</script>

<template>
  <div class="ad-placements-page">
    <div class="page-header">
      <h1>{{ $t('admin.ad.placements.title') }}</h1>
      <Button :label="$t('common.create')" @click="openCreateDialog" />
    </div>

    <DataTable :value="placements" :loading="!placements">
      <Column field="name" :header="$t('admin.ad.name')" />
      <Column field="location" :header="$t('admin.ad.location')" />
      <Column field="format" :header="$t('admin.ad.format')" />
      <Column field="adapterId" :header="$t('admin.ad.adapter')" />
      <Column field="enabled" :header="$t('admin.ad.status')">
        <template #body="{ data }">
          <Tag :value="data.enabled ? '启用' : '禁用'" :severity="data.enabled ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column>
        <template #body="{ data }">
          <Button icon="pi pi-pencil" size="small" @click="openEditDialog(data)" />
          <Button icon="pi pi-trash" size="small" severity="danger" @click="handleDelete(data.id)" />
        </template>
      </Column>
    </DataTable>

    <AdPlacementDialog
      v-model:visible="dialog.visible"
      :mode="dialog.mode"
      :data="dialog.data"
      @save="handleSave"
    />
  </div>
</template>
```

## 7. 内容注入策略

### 7.1 文章内容广告注入

**位置**: `composables/useAdInjection.ts`

```typescript
export function useAdInjection() {
  const { locale } = useI18n()
  const { data: placements } = useFetch('/api/ads/placements')

  /**
   * 在文章内容中注入广告
   * @param content 文章 HTML 内容
   * @param context 文章上下文
   * @returns 注入后的 HTML
   */
  function injectAds(
    content: string,
    context: {
      postId: string
      categories: string[]
      tags: string[]
    }
  ): string {
    const parser = new DOMParser()
    const doc = parser.parseFromString(content, 'text/html')
    const paragraphs = doc.querySelectorAll('p')

    // 获取匹配的广告位
    const contentAds = placements.value?.filter(p =>
      p.location === AdLocation.CONTENT_MIDDLE ||
      p.location === AdLocation.CONTENT_BOTTOM
    ) || []

    // 按优先级排序
    contentAds.sort((a, b) => b.priority - a.priority)

    // 在中间插入（约50%位置）
    const middleIndex = Math.floor(paragraphs.length * 0.5)
    const middleAd = contentAds.find(ad =>
      !ad.targeting?.locales ||
      ad.targeting.locales.includes(locale.value)
    )

    if (middleAd && paragraphs[middleIndex]) {
      const adDiv = doc.createElement('div')
      adDiv.innerHTML = renderAdPlacement(middleAd)
      paragraphs[middleIndex].after(adDiv)
    }

    return doc.body.innerHTML
  }

  return {
    injectAds,
  }
}
```

### 7.2 Locale 定向控制

```typescript
// server/services/ad/targeting.ts
export function evaluateTargeting(
  placement: AdPlacement,
  context: {
    locale: string
    categories: string[]
    tags: string[]
  }
): boolean {
  const { targeting } = placement

  // 语言定向
  if (targeting?.locales && !targeting.locales.includes(context.locale)) {
    return false
  }

  // 分类定向
  if (targeting?.categories && targeting.categories.length > 0) {
    const hasMatch = targeting.categories.some(cat =>
      context.categories.includes(cat)
    )
    if (!hasMatch) return false
  }

  // 标签定向
  if (targeting?.tags && targeting.tags.length > 0) {
    const hasMatch = targeting.tags.some(tag =>
      context.tags.includes(tag)
    )
    if (!hasMatch) return false
  }

  return true
}
```

## 8. 安全考虑

### 8.1 外链安全
- **XSS 防护**: 所有用户输入的 URL 必须验证格式
- **黑名单机制**: 支持维护恶意域名黑名单
- **sandbox 属性**: 跳转页使用 iframe sandbox 限制

### 8.2 广告安全
- **CSP 策略**: 为广告域名配置适当的 Content-Security-Policy
- **隐私保护**: 遵守 GDPR/CCPA 要求，提供广告追踪 opt-out
- **性能优化**: 广告脚本异步加载，不阻塞页面渲染

### 8.3 防滥用
- **点击频率限制**: 防止恶意点击刷量
- **会话展示限制**: 避免过度展示影响用户体验

## 9. 实施计划

### Phase 1: 基础架构 (Week 1)
- [ ] 创建广告实体 (AdPlacement, AdCampaign, ExternalLink)
- [ ] 实现广告适配器基类和工厂
- [ ] 开发 Google AdSense 适配器

### Phase 2: 内容注入 (Week 2)
- [ ] 实现广告注入逻辑
- [ ] 创建广告位前端组件
- [ ] 实现 Locale 定向

### Phase 3: 国产广告 (Week 3)
- [ ] 开发百度联盟适配器
- [ ] 开发腾讯广告适配器
- [ ] 完善定向投放逻辑

### Phase 4: 外链管理 (Week 4)
- [ ] 实现外链短码生成
- [ ] 开发跳转页组件
- [ ] 添加点击统计

### Phase 5: 管理界面 (Week 5)
- [ ] 创建广告位管理页面
- [ ] 创建广告活动管理页面
- [ ] 创建外链管理页面
- [ ] 添加统计报表

## 10. 相关文档

- [商业模块设计](./commercial.md)
- [博客模块设计](./blog.md)
- [安全规范](../../standards/security.md)
- [UI 设计](../ui.md)
