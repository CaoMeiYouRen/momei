<template>
    <div class="admin-page-container">
        <AdminPageHeader :title="$t('pages.admin.posts.title')" show-language-switcher>
            <template #actions>
                <CaomeiButton
                    v-if="selectedItems.length > 0"
                    variant="secondary"
                    :loading="exporting"
                    class="mr-2"
                    @click="handleBatchExport"
                >
                    <template #icon>
                        <Download :size="16" />
                    </template>
                    {{ $t('pages.admin.posts.export_selected') }}
                </CaomeiButton>
                <CaomeiButton @click="navigateTo(localePath('/admin/posts/new'))">
                    <template #icon>
                        <Plus :size="16" />
                    </template>
                    {{ $t('pages.admin.posts.create') }}
                </CaomeiButton>
            </template>
        </AdminPageHeader>

        <div class="admin-content-card">
            <div class="admin-filters">
                <!-- 迁移前为 `IconField` + `InputIcon` + `InputText`；§6.1 C 组：IconField / InputIcon
                     由 `CaomeiInput` 的 `#prefix` 插槽承接（图标同步换成 lucide `Search`）。
                     宽度按迁移前实测固有宽（`IconField` 261px）显式约束——caomei 字段默认 `width: 100%`，
                     在 flex 行内会撑满容器（「迁移不改几何」）。 -->
                <CaomeiInput
                    v-model="filters.search"
                    class="admin-filters__search"
                    :placeholder="$t('pages.admin.posts.search_placeholder')"
                    @update:model-value="onFilterChange"
                >
                    <template #prefix>
                        <Search :size="16" />
                    </template>
                </CaomeiInput>
                <div class="admin-filters__right">
                    <div class="aggregate-toggle">
                        <!-- 迁移前 `ToggleSwitch` + `input-id` + 原生 `label[for]`：caomei `id` 落在
                             Reka `SwitchRoot`（`<button role="switch">`，labelable），`label[for]` 的点击
                             转发与可访问名推导（Reka 从 `label[for=id]` 取文本）均保持。 -->
                        <CaomeiSwitch
                            id="aggregate-switch"
                            v-model="filters.aggregate"
                            @change="onFilterChange"
                        />
                        <label for="aggregate-switch" class="cursor-pointer">{{ $t('common.aggregate_translations') }}</label>
                    </div>
                    <div class="admin-filters__status">
                        <!-- 迁移前 `.status-select { width: 10rem }` 作用于 PrimeVue `Select` 的根
                             （字段外壳）；caomei `Select` 的 `class` 只落触发器、宽度钩子在字段外层
                             （上游反馈 §1.1），故宽度改由包装元素承载。
                             `show-clear` → `show-clear`；`@change`（PrimeVue 专有事件）→
                             `@update:model-value`（caomei `Select` 仅抛该事件）。 -->
                        <CaomeiSelect
                            v-model="filters.status"
                            :options="statuses"
                            option-label="label"
                            option-value="value"
                            :placeholder="$t('pages.admin.posts.status')"
                            show-clear
                            @update:model-value="load"
                        />
                    </div>
                </div>
            </div>

            <!-- 懒加载服务端分页 + 服务端排序 + 行多选：`page` / `@page` 为 1 基受控值
                 （由共享 composable 的 `pageIndexBase: 1` 归一）；`selection-mode="multiple"`
                 由 `CaomeiDataTable` 内建首列（迁移前为 `<Column selection-mode="multiple" />`）。

                 受控分页口径（与既有 5 条已迁移路由一致）：迁移前 PrimeVue 未绑定 `v-model:first`，
                 由组件自持页码；本页改为受控 `:page="pagination.page"`，使「筛选后回到第 1 页」
                 由 `page` 状态统一驱动。已知边界：受控后 caomei 的
                 `watch([rows, totalRecords])` 提前返回，故不再有「总条数收缩时自动夹取页码」的
                 内部收敛——极端场景（删除末页最后一条后 `page` 越界）下分页器会停在越界页，
                 与迁移前行为**可能不同**；本批按「迁移不改流程」处置并登记为观察项。 -->
            <CaomeiDataTable
                v-model:selection="selectedItems"
                :data="items"
                :columns="columns"
                :loading="loading"
                lazy
                :total-records="pagination.total"
                :rows="pagination.limit"
                :page="pagination.page"
                paginator
                :rows-per-page-options="[5, 10, 20, 50]"
                selection-mode="multiple"
                row-key="id"
                class="admin-posts__table"
                @page="onPage"
                @sort="onSort"
            >
                <template #cell-status="{row}">
                    <CaomeiTag :tone="getPostStatusTone(row.status)">
                        {{ getStatusLabel(row.status) }}
                    </CaomeiTag>
                </template>

                <template #cell-isPinned="{row}">
                    <CaomeiTag :tone="row.isPinned ? 'primary' : 'neutral'">
                        {{ row.isPinned ? $t('common.yes') : $t('common.no') }}
                    </CaomeiTag>
                </template>

                <template #cell-coverImage="{row}">
                    <PostMediaPreviewCell
                        :post="row"
                        mode="cover"
                        :preferred-locale="preferredMediaLocale"
                    />
                </template>

                <template #cell-audioUrl="{row}">
                    <PostMediaPreviewCell
                        :post="row"
                        mode="audio"
                        :preferred-locale="preferredMediaLocale"
                    />
                </template>

                <template #cell-translations="{row}">
                    <div class="justify-content-center translation-badges">
                        <!-- `Badge` **确有** `value` prop（与 `Tag` 不同，见迁移方案 §6.2），故沿用 `:value`。 -->
                        <CaomeiBadge
                            v-for="lang in availableLocalesList"
                            :key="lang.code"
                            v-tooltip="$t('common.languages.' + lang.code)"
                            :value="lang.code.toUpperCase()"
                            :tone="hasTranslation(row, lang.code) ? 'success' : 'neutral'"
                            class="translation-badge"
                            :class="{'translation-badge--missing': !hasTranslation(row, lang.code)}"
                            @click="handleTranslationClick(row, lang.code)"
                        />
                    </div>
                </template>

                <template #cell-language="{row}">
                    <CaomeiTag tone="neutral">
                        {{ $t(`common.languages.${row.language}`) }}
                    </CaomeiTag>
                </template>

                <template #cell-publishedAt="{row}">
                    <div class="user-created-at" data-visual-mask>
                        <span class="user-created-at__date">{{ formatDateTime(row.publishedAt) }}</span>
                        <small
                            v-if="row.publishedAt"
                            class="user-created-at__relative"
                            :class="{'user-created-at__relative--future': isFuture(row.publishedAt)}"
                        >
                            {{ relativeTime(row.publishedAt) }}
                        </small>
                    </div>
                </template>

                <template #cell-audit="{row}">
                    <PostAuditBadgeV2
                        :audit-result="auditResults.get(row.id) ?? null"
                        :loading="auditingPostId === row.id"
                        @run-audit="runAudit(row.id)"
                        @show-detail="openAuditDialog(row.id)"
                    />
                </template>

                <template #cell-actions="{row}">
                    <!-- 迁移前 5 个按钮均为 `text rounded` + 纯图标：caomei 侧用 0.6.0 `iconOnly` +
                         lucide `#icon`（不再复制本地补丁写法），并按契约补 `:label` 可访问名——
                         迁移前仅前三个有 `v-tooltip`，编辑 / 删除两个**既无可见文本也无可访问名**。 -->
                    <CaomeiButton
                        v-tooltip.top="$t('pages.admin.posts.distribution.tooltip')"
                        icon-only
                        variant="ghost"
                        rounded
                        tone="neutral"
                        :label="$t('pages.admin.posts.distribution.tooltip')"
                        @click="openDistribution(row.id)"
                    >
                        <template #icon>
                            <RefreshCw :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        v-if="row.status === 'published'"
                        v-tooltip.top="$t('pages.admin.posts.repush')"
                        icon-only
                        variant="ghost"
                        rounded
                        tone="warning"
                        :label="$t('pages.admin.posts.repush')"
                        @click="confirmRepush(row)"
                    >
                        <template #icon>
                            <Send :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        v-tooltip.top="$t('common.export')"
                        icon-only
                        variant="ghost"
                        rounded
                        tone="neutral"
                        :label="$t('common.export')"
                        @click="handleExport(row)"
                    >
                        <template #icon>
                            <Download :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        rounded
                        tone="primary"
                        :label="$t('common.edit')"
                        @click="editPost(row.id)"
                    >
                        <template #icon>
                            <Pencil :size="16" />
                        </template>
                    </CaomeiButton>
                    <CaomeiButton
                        icon-only
                        variant="ghost"
                        rounded
                        tone="danger"
                        :label="$t('common.delete')"
                        @click="openPostDeleteDialog(row)"
                    >
                        <template #icon>
                            <Trash2 :size="16" />
                        </template>
                    </CaomeiButton>
                </template>

                <template #empty>
                    <div class="empty-state">
                        {{ $t('pages.posts.empty') }}
                    </div>
                </template>
            </CaomeiDataTable>
        </div>

        <!-- 浮层显式豁免（迁移方案 §5.5）：`ConfirmDeleteDialog` 维持 PrimeVue（随浮层批次收敛）。 -->
        <ConfirmDeleteDialog
            ref="deleteDialog"
            @confirm="handleDelete"
        />

        <!-- 三件套过渡组件（消费处静态择库，迁移方案 §5.5）：已迁移路由用 `…V2`，
             `/admin/posts/[id]` 编辑器路由继续用 V1。 -->
        <PostAuditDialogV2
            :visible="showAuditDialog"
            :result="selectedAuditResult"
            :ai-pending="auditingPostId !== null"
            :re-auditing="reAuditingPostId !== null"
            @close="closeAuditDialog"
            @re-audit="handleReAudit"
        />

        <PublishPushDialogV2
            ref="repushDialog"
            @confirm="handleRepushConfirm"
        />
    </div>
</template>

<script setup lang="ts">
import { Download, Pencil, Plus, RefreshCw, Search, Send, Trash2 } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import { ref, computed } from 'vue'
import PostMediaPreviewCell from '@/components/admin/posts/post-media-preview-cell.vue'
import PostAuditBadgeV2 from '@/components/admin/posts/post-audit-badge-v2.vue'
import PostAuditDialogV2 from '@/components/admin/posts/post-audit-dialog-v2.vue'
import PublishPushDialogV2 from '@/components/admin/posts/publish-push-dialog-v2.vue'
import { useAdminI18n } from '@/composables/use-admin-i18n'
import { getPostStatusSeverity } from '@/composables/use-post-editor-page.helpers'
import { ensureLocaleMessageModules } from '@/i18n/config/locale-runtime-loader'
import type { Post, PostAuditResult } from '@/types/post'
import { useAdminList } from '@/composables/use-admin-list'
import { useI18nDate } from '@/composables/use-i18n-date'
import { computeQuickAuditResult } from '@/utils/shared/post-audit-quick'

definePageMeta({
    middleware: 'author',
    layout: 'default',
})

const { t, locale } = useI18n()
const localePath = useLocalePath()
const nuxtApp = useNuxtApp()
const { formatDateTime, relativeTime, isFuture } = useI18nDate()
const { showErrorToast, showSuccessToast } = useRequestFeedback()
const { contentLanguage } = useAdminI18n()

await ensureLocaleMessageModules({
    i18n: nuxtApp.$i18n as object,
    locale: locale.value,
    modules: ['admin-posts', 'admin-marketing'],
})

const selectedItems = ref<Post[]>([])
const { exporting, exportPost, exportBatch } = usePostExport()

const {
    items,
    loading,
    pagination,
    filters,
    onPage,
    onSort,
    onFilterChange,
    refresh: load,
} = useAdminList<Post, { search: string, status: string | null, aggregate: boolean }>({
    url: '/api/posts',
    initialFilters: {
        search: '',
        status: null,
        aggregate: true, // 默认开启聚合
    },
    initialSort: {
        field: 'publishedAt',
        order: 'desc',
    },
    // caomei `DataTable` 的 `page` / `@page` 为 1 基（PrimeVue 为 0 基），显式声明页码基准。
    pageIndexBase: 1,
})

const { locales } = useI18n()
const availableLocalesList = computed(() => locales.value as { code: string, name: string }[])
const preferredMediaLocale = computed(() => contentLanguage.value || locale.value)

const hasTranslation = (post: Post, lang: string) => {
    return post.translations?.some((t) => t.language === lang)
}

const handleTranslationClick = (post: Post, lang: string) => {
    const translation = post.translations?.find((t) => t.language === lang)
    if (translation) {
        editPost(translation.id)
    } else {
        // 创建新翻译
        navigateTo({
            path: localePath('/admin/posts/new'),
            query: {
                translationId: post.translationId || post.id,
                language: lang,
            },
        })
    }
}

const statuses = computed(() => [
    { label: t('common.status.published'), value: 'published' },
    { label: t('common.status.scheduled'), value: 'scheduled' },
    { label: t('common.status.draft'), value: 'draft' },
    { label: t('common.status.pending'), value: 'pending' },
    { label: t('common.status.rejected'), value: 'rejected' },
    { label: t('common.status.hidden'), value: 'hidden' },
])

/**
 * 列定义与迁移前 PrimeVue 列组件一一对应（12 列 + 条件列 `language`，条件列在聚合开启时不入列，共 13 列定义）：
 *
 * - 有 `field` 的列沿用字段名作 key；`author.name` / `category.name` 为点号路径，
 *   用 `accessor` 承载（避免 `#cell-author.name` 这类含点号的插槽名）；
 *   无 `field` 的两列按插槽语义命名（`translations` / `audit`）。
 * - PrimeVue `Column` 的 `style` / `class` **同时落 `th` 与 `td`**（实测两态 inline style 与
 *   class 逐字一致），caomei 侧 `headerStyle` / `bodyStyle` 分别对应 `th` / `td`，
 *   故 `style` / `class` 一律两侧镜像，保持逐单元格声明等价。
 * - `header-class="text-center"` 在迁移前落 `th`（与 `body-class` 一起构成「表头 + 单元格居中对齐」），
 *   照原样映射为 `headerClass` / `bodyClass`。
 * - `class="hidden md:table-cell"`（响应式隐藏）在本仓**无任何可命中表格单元格的样式规则**
 *   （全仓 SCSS 与构建产物中均无 `table-cell` 定义；`components/app-uploader.scss` 内的 `.hidden`
 *   是 `.app-uploader` 下的 scoped 嵌套规则，不命中表格 `th` / `td`）——属迁移期幻影类：保留原声明
 *   以免静默丢弃既有意图，已登记为幻影类收尾项（见回归记录本批窗口）。
 * - 迁移前动作列的 `:exportable="false"` **无对应落点**（caomei `DataTable` 无 CSV / 导出能力，
 *   且本页导出走 `usePostExport`），属惰性声明，不迁移。
 * - 条件列 `language` 在迁移前由 `v-if="!filters.aggregate"` 控制列的有无，这里以同一条件
 *   决定是否加入 `columns`（列集合语义等价）。
 */
const columns = computed<DataTableColumn<Post>[]>(() => {
    const list: DataTableColumn<Post>[] = [
        {
            key: 'title',
            header: t('common.title'),
            sortable: true,
            headerStyle: { minWidth: '15rem' },
        },
        {
            key: 'author',
            accessor: 'author.name',
            header: t('common.author'),
            headerStyle: { minWidth: '8rem' },
            headerClass: 'hidden lg:table-cell',
            bodyClass: 'hidden lg:table-cell',
        },
        {
            key: 'status',
            header: t('pages.admin.posts.status'),
            sortable: true,
            headerStyle: { minWidth: '7rem' },
            headerClass: 'hidden md:table-cell',
            bodyClass: 'hidden md:table-cell',
        },
        {
            key: 'isPinned',
            header: t('pages.admin.posts.pinned'),
            sortable: true,
            headerStyle: { minWidth: '6rem' },
            headerClass: 'text-center hidden md:table-cell',
            bodyClass: 'text-center hidden md:table-cell',
        },
        {
            key: 'coverImage',
            header: t('pages.admin.posts.cover_column'),
            headerStyle: { minWidth: '7rem' },
            headerClass: 'text-center',
            bodyClass: 'text-center',
        },
        {
            key: 'audioUrl',
            header: t('pages.admin.posts.podcast_column'),
            headerStyle: { minWidth: '14rem' },
            headerClass: 'text-center',
            bodyClass: 'text-center',
        },
        {
            key: 'translations',
            header: t('common.translation_status'),
            headerStyle: { minWidth: '8rem' },
            headerClass: 'text-center',
            bodyClass: 'text-center',
        },
        {
            key: 'category',
            accessor: 'category.name',
            header: t('common.category'),
            headerStyle: { minWidth: '8rem' },
            headerClass: 'hidden sm:table-cell',
            bodyClass: 'hidden sm:table-cell',
        },
    ]

    if (!filters.value.aggregate) {
        list.push({
            key: 'language',
            header: t('common.language'),
            sortable: true,
        })
    }

    list.push(
        {
            key: 'views',
            header: t('common.views'),
            sortable: true,
            // 迁移前 `style="width: 6rem"` 同时落 `th` / `td`（实测 inline 声明一致），故两侧镜像。
            headerStyle: { width: '6rem' },
            bodyStyle: { width: '6rem' },
            headerClass: 'text-center',
            bodyClass: 'text-center',
        },
        {
            key: 'publishedAt',
            header: t('common.published_at'),
            sortable: true,
            headerStyle: { minWidth: '9rem' },
        },
        {
            key: 'audit',
            header: t('pages.admin.posts.audit.column_header'),
            headerStyle: { minWidth: '7rem' },
            headerClass: 'text-center',
            bodyClass: 'text-center',
        },
        {
            key: 'actions',
            header: t('common.actions'),
            // 迁移前动作列为 `style="min-width: 8rem"` + `frozen` + `align-frozen="right"`；
            // caomei 以 `frozen: 'right'` 承接冻结语义，`min-width` 两侧镜像（`th` / `td` 均实测生效）。
            headerStyle: { minWidth: '8rem' },
            bodyStyle: { minWidth: '8rem' },
            frozen: 'right',
        },
    )

    return list
})

const editPost = (id: string) => {
    navigateTo(localePath(`/admin/posts/${id}`))
}

const openDistribution = (id: string) => {
    navigateTo(localePath({
        path: `/admin/posts/${id}`,
        query: {
            openDistribution: 'true',
        },
    }))
}

const repushDialog = ref<InstanceType<typeof PublishPushDialogV2> | null>(null)
const repushPost = ref<Post | null>(null)

const confirmRepush = (post: Post) => {
    repushPost.value = post
    repushDialog.value?.open?.({
        pushOption: 'draft',
        criteria: {
            categoryIds: post.categoryId ? [post.categoryId] : [],
            tagIds: post.tags?.map((tag: { id: string }) => tag.id) || [],
        },
    })
}

const handleRepushConfirm = async (options: {
    pushOption: 'none' | 'draft' | 'now'
    publishedAt?: Date | null
    pushCriteria?: { categoryIds?: string[], tagIds?: string[] }
}) => {
    if (!repushPost.value || options.pushOption === 'none') {
        return
    }

    try {
        await $fetch(`/api/admin/posts/${repushPost.value.id}/repush`, {
            method: 'POST',
            body: {
                pushOption: options.pushOption,
                pushCriteria: options.pushCriteria,
                publishedAt: options.publishedAt ? options.publishedAt.toISOString() : null,
            },
        })
        showSuccessToast('pages.admin.posts.repush_success')
    } catch (error) {
        console.error('Failed to repush post', error)
        showErrorToast(error, { fallbackKey: 'common.save_failed' })
    } finally {
        repushPost.value = null
    }
}

const deleteDialog = ref()
const postToDelete = ref<Post | null>(null)

/**
 * 状态 Tag 的语义色：caomei `Tag` 无 `severity`，改用 `tone`（迁移方案 §6.2 / §6.3 有意差异）。
 *
 * 状态 → `severity` 的映射由共享 helper `getPostStatusSeverity` 承载，而该 helper 同时服务
 * `/admin/posts/[id]` 编辑器路由（本阶段仍为 PrimeVue）、且有单测锁定 PrimeVue 词表，
 * 故按 §5.5「路由内组件来源唯一」的口径不在共享 helper 内改写，而是在本页做一次
 * 有损近似转换（§6.2）：`success` / `danger` 直通、`warn` → `warning`、`info` → `primary`、
 * `secondary` → `neutral`。helper 对未知状态兜底为 `info`，故本映射的兜底分支亦为 `primary`。
 */
const SEVERITY_TO_TONE_MAP: Record<string, 'success' | 'warning' | 'danger' | 'primary' | 'neutral'> = {
    success: 'success',
    warn: 'warning',
    danger: 'danger',
    info: 'primary',
    secondary: 'neutral',
}

const getPostStatusTone = (status: string) => SEVERITY_TO_TONE_MAP[getPostStatusSeverity(status)] ?? 'neutral'

const openPostDeleteDialog = (post: Post) => {
    postToDelete.value = post
    deleteDialog.value.open()
}

const handleDelete = async () => {
    if (!postToDelete.value) return

    deleteDialog.value.setLoading(true)
    try {
        await $fetch(`/api/posts/${postToDelete.value.id}`, { method: 'DELETE' as any })
        deleteDialog.value.close()
        load()
    } catch (error) {
        console.error('Failed to delete post:', error)
    } finally {
        deleteDialog.value.setLoading(false)
    }
}

const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        published: t('common.status.published'),
        scheduled: t('common.status.scheduled'),
        draft: t('common.status.draft'),
        pending: t('common.status.pending'),
        rejected: t('common.status.rejected'),
        hidden: t('common.status.hidden'),
    }
    return map[status] || status
}

const handleExport = (post: Post) => {
    exportPost(post.id, {
        slug: post.slug,
        all: !!filters.value.aggregate && (post.translations?.length || 0) > 1,
    })
}

const handleBatchExport = async () => {
    if (selectedItems.value.length === 0) return
    const ids: string[] = []
    selectedItems.value.forEach((item) => {
        ids.push(item.id)
        if (filters.value.aggregate && item.translations) {
            item.translations.forEach((t) => {
                if (t.id !== item.id) {
                    ids.push(t.id)
                }
            })
        }
    })
    await exportBatch(ids)
    selectedItems.value = []
}

// ===== AI 内容审计 =====

const auditingPostId = ref<string | null>(null)
const reAuditingPostId = ref<string | null>(null)
const auditResults = ref<Map<string, PostAuditResult>>(new Map())
const showAuditDialog = ref(false)
const selectedAuditResult = ref<PostAuditResult | null>(null)
const selectedAuditPostId = ref<string | null>(null)

async function runAudit(postId: string) {
    const targetPost = items.value.find((item) => item.id === postId)
    if (!targetPost) {
        return
    }

    selectedAuditPostId.value = postId
    selectedAuditResult.value = computeQuickAuditResult(targetPost)
    showAuditDialog.value = true
    auditingPostId.value = postId
    try {
        const result = await $fetch<{ code: number, data: PostAuditResult }>(`/api/admin/posts/${postId}/audit`, {
            method: 'POST',
            body: { force: false, locale: locale.value },
        })
        const auditResult = result.data
        auditResults.value = new Map(auditResults.value).set(postId, auditResult)
        selectedAuditResult.value = auditResult
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.save_failed' })
    } finally {
        auditingPostId.value = null
    }
}

function openAuditDialog(postId: string) {
    const cached = auditResults.value.get(postId)
    if (cached) {
        selectedAuditPostId.value = postId
        selectedAuditResult.value = cached
        showAuditDialog.value = true
    }
}

function closeAuditDialog() {
    showAuditDialog.value = false
    selectedAuditResult.value = null
    selectedAuditPostId.value = null
    reAuditingPostId.value = null
}

async function handleReAudit() {
    const postId = selectedAuditPostId.value
    if (!postId) return

    reAuditingPostId.value = postId
    try {
        const result = await $fetch<{ code: number, data: PostAuditResult }>(`/api/admin/posts/${postId}/audit`, {
            method: 'POST',
            body: { force: true, locale: locale.value },
        })
        const auditResult = result.data
        auditResults.value = new Map(auditResults.value).set(postId, auditResult)
        selectedAuditResult.value = auditResult
    } catch (error) {
        showErrorToast(error, { fallbackKey: 'common.save_failed' })
    } finally {
        reAuditingPostId.value = null
    }
}
</script>

<style lang="scss" scoped>
// 搜索字段宽度：caomei 字段默认 `width: 100%`（`CaomeiInput` / `CaomeiSelect` 家族），
// 在 `.admin-filters`（flex 行）内会撑满容器。迁移前 `IconField` 内 `InputText` 的固有宽实测 261px，
// 故显式约束为同一值（「迁移不改几何」）。
.admin-filters__search {
    width: 261px;
    max-width: 100%;
}

// caomei `Select` 的 `class` 只落触发器、宽度 / `max-width` 钩子在**字段外层**
// （`.caomei-select__field`，上游反馈 §1.1）；迁移前 `.status-select { width: 10rem }` 作用于
// PrimeVue `Select` 的根（字段外壳），故宽度改由包装元素承载（10rem < 字段默认 `20rem` 上限，无需改 token）。
.admin-filters__status {
    width: 10rem;
    max-width: 100%;
}

// caomei `DataTable` 分页容器默认右对齐（PrimeVue 默认居中）；用 0.4.0 起提供的
// `--caomei-data-table-pagination-justify` token 保持迁移前布局（迁移不改几何）。
.admin-posts__table {
    --caomei-data-table-pagination-justify: center;

    // 迁移前 `table-style="min-width: 80rem"`（配合 PrimeVue `scrollable` + 冻结动作列的等效声明，
    // 落在 `<table>` 上）；caomei `DataTable` 无 `table-style` / `scrollable` 契约
    // （根元素默认 `overflow-x: auto`，冻结列吸边由 `frozen` 提供），故以 scoped 深度选择器保持同一声明。
    :deep(.caomei-data-table__table) {
        min-width: 80rem;
    }
}

.empty-state {
    text-align: center;
    padding: 1rem;
}

.user-created-at {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &__relative {
        color: var(--p-text-muted-color);
        font-size: 0.75rem;

        &--future {
            color: var(--p-primary-color);
        }
    }
}

.translation-badges {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;

    &.justify-content-center {
        justify-content: center;
    }
}

// caomei `Badge` 的尺寸档位与 PrimeVue `Badge` 不同（caomei 默认 20px 高 / `space-1` 横向内边距）。
// 迁移前这几个翻译徽标的尺寸来源是三处叠加：PrimeVue Aura `Badge` 根 token `height: 1.5rem` /
// `minWidth: 1.5rem` + 全局 `.translation-badge.p-badge { padding: 2px 4px; font-size: 0.7rem }` +
// `.translation-badge { min-width: 2rem }`。故按实测口径覆盖 caomei token（token 是文档化定制路径，
// 优先级 ①）：高 24px / 最小宽 32px / 横向内边距 4px / 字号 0.7rem。
.translation-badge {
    --caomei-badge-height: 1.5rem;
    --caomei-badge-min-width: 2rem;
    --caomei-badge-padding-x: 4px;
    --caomei-badge-font-size: 0.7rem;

    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.8;
    }

    &--missing {
        filter: grayscale(1) opacity(0.5);
    }
}
</style>
