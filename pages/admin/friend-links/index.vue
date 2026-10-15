<template>
    <div class="admin-friend-links page-container">
        <AdminPageHeader :title="tt('pages.admin.friend_links.title')">
            <template #actions>
                <div class="admin-friend-links__header-actions">
                    <CaomeiButton
                        variant="secondary"
                        @click="openCategoryDialog()"
                    >
                        {{ tt('pages.admin.friend_links.create_category') }}
                    </CaomeiButton>
                    <CaomeiButton @click="openLinkDialog()">
                        <template #icon>
                            <Plus :size="16" />
                        </template>
                        {{ tt('pages.admin.friend_links.create_link') }}
                    </CaomeiButton>
                </div>
            </template>
        </AdminPageHeader>

        <div class="admin-friend-links__section">
            <div class="admin-friend-links__section-header">
                <h2>{{ tt('pages.admin.friend_links.links') }}</h2>
                <CaomeiButton
                    icon-only
                    variant="ghost"
                    :label="$t('common.refresh')"
                    @click="loadLinks"
                >
                    <template #icon>
                        <RefreshCw :size="16" />
                    </template>
                </CaomeiButton>
            </div>

            <CaomeiDataTable
                :data="links"
                :columns="linkColumns"
                :loading="loading.links"
                class="admin-friend-links__table"
            >
                <template #cell-url="{row}">
                    <a
                        :href="row.url"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="admin-friend-links__external-link"
                    >
                        {{ row.url }}
                    </a>
                </template>

                <template #cell-category="{row}">
                    {{ row.category?.name || tt('pages.links.uncategorized') }}
                </template>

                <template #cell-status="{row}">
                    <CaomeiTag :tone="getLinkStatusTone(row.status)">
                        {{ tt(`pages.admin.friend_links.statuses.${row.status}`) }}
                    </CaomeiTag>
                </template>

                <template #cell-healthStatus="{row}">
                    <CaomeiTag :tone="getHealthStatusTone(row.healthStatus)">
                        {{ tt(getFriendLinkHealthStatusLabelKey(row.healthStatus)) }}
                    </CaomeiTag>
                </template>

                <template #cell-isFeatured="{row}">
                    <CaomeiTag :tone="row.isFeatured ? 'success' : 'neutral'">
                        {{ row.isFeatured ? $t('common.yes') : $t('common.no') }}
                    </CaomeiTag>
                </template>

                <template #cell-isPinned="{row}">
                    <CaomeiTag :tone="row.isPinned ? 'primary' : 'neutral'">
                        {{ row.isPinned ? $t('common.yes') : $t('common.no') }}
                    </CaomeiTag>
                </template>

                <template #cell-lastCheckedAt="{row}">
                    {{ formatDateTime(row.lastCheckedAt) }}
                </template>

                <template #cell-actions="{row}">
                    <div class="admin-friend-links__actions">
                        <CaomeiButton
                            v-if="shouldSuggestReviewOrDisable(row)"
                            variant="ghost"
                            tone="warning"
                            size="sm"
                            @click="confirmReviewOrDisable(row)"
                        >
                            <template #icon>
                                <TriangleAlert :size="16" />
                            </template>
                            {{ tt('pages.admin.friend_links.suggest_review_or_disable') }}
                        </CaomeiButton>
                        <CaomeiButton
                            icon-only
                            variant="ghost"
                            rounded
                            tone="primary"
                            :label="tt('pages.admin.friend_links.edit_link')"
                            @click="openLinkDialog(row)"
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
                            :label="tt('pages.admin.friend_links.delete_link')"
                            @click="confirmDeleteLink(row)"
                        >
                            <template #icon>
                                <Trash2 :size="16" />
                            </template>
                        </CaomeiButton>
                    </div>
                </template>

                <template #empty>
                    <div class="admin-friend-links__empty">
                        {{ tt('pages.admin.friend_links.empty_links') }}
                    </div>
                </template>
            </CaomeiDataTable>
        </div>

        <div class="admin-friend-links__split">
            <section class="admin-friend-links__section admin-friend-links__section--half">
                <div class="admin-friend-links__section-header">
                    <h2>{{ tt('pages.admin.friend_links.categories') }}</h2>
                </div>

                <CaomeiDataTable
                    :data="categories"
                    :columns="categoryColumns"
                    :loading="loading.categories"
                    class="admin-friend-links__table"
                >
                    <template #cell-isEnabled="{row}">
                        <CaomeiTag :tone="row.isEnabled ? 'success' : 'neutral'">
                            {{ row.isEnabled ? tt('pages.admin.friend_links.enabled') : tt('pages.admin.friend_links.disabled') }}
                        </CaomeiTag>
                    </template>

                    <template #cell-actions="{row}">
                        <div class="admin-friend-links__actions">
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                rounded
                                tone="primary"
                                :label="tt('pages.admin.friend_links.edit_category')"
                                @click="openCategoryDialog(row)"
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
                                :label="tt('pages.admin.friend_links.delete_category')"
                                @click="confirmDeleteCategory(row)"
                            >
                                <template #icon>
                                    <Trash2 :size="16" />
                                </template>
                            </CaomeiButton>
                        </div>
                    </template>

                    <template #empty>
                        <div class="admin-friend-links__empty">
                            {{ tt('pages.admin.friend_links.empty_categories') }}
                        </div>
                    </template>
                </CaomeiDataTable>
            </section>

            <section class="admin-friend-links__section admin-friend-links__section--half">
                <div class="admin-friend-links__section-header">
                    <h2>{{ tt('pages.admin.friend_links.applications') }}</h2>
                </div>

                <CaomeiDataTable
                    :data="applications"
                    :columns="applicationColumns"
                    :loading="loading.applications"
                    class="admin-friend-links__table"
                >
                    <template #cell-createdAt="{row}">
                        {{ formatDateTime(row.createdAt) }}
                    </template>

                    <template #cell-status="{row}">
                        <CaomeiTag :tone="getApplicationStatusTone(row.status)">
                            {{ tt(getFriendLinkApplicationStatusLabelKey(row.status)) }}
                        </CaomeiTag>
                    </template>

                    <template #cell-actions="{row}">
                        <div class="admin-friend-links__actions">
                            <CaomeiButton
                                icon-only
                                variant="ghost"
                                rounded
                                tone="primary"
                                :label="tt('pages.admin.friend_links.review_application')"
                                @click="openReviewDialog(row)"
                            >
                                <template #icon>
                                    <Eye :size="16" />
                                </template>
                            </CaomeiButton>
                        </div>
                    </template>

                    <template #empty>
                        <div class="admin-friend-links__empty">
                            {{ tt('pages.admin.friend_links.empty_applications') }}
                        </div>
                    </template>
                </CaomeiDataTable>
            </section>
        </div>

        <!-- 浮层显式豁免（迁移方案 §5.5）：`Dialog` ×3 / `ConfirmDialog` / `Toast` / `useConfirm` 维持 PrimeVue 至第六十九阶段。 -->
        <Dialog
            v-model:visible="linkDialogVisible"
            :header="editingLink ? tt('pages.admin.friend_links.edit_link') : tt('pages.admin.friend_links.create_link')"
            modal
            class="admin-friend-links__dialog"
        >
            <div class="admin-friend-links__form">
                <div class="admin-friend-links__field">
                    <label for="link-name">{{ $t('common.name') }} *</label>
                    <CaomeiInput
                        id="link-name"
                        v-model="linkForm.name"
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-url">{{ tt('components.friend_links.fields.site_url') }} *</label>
                    <CaomeiInput
                        id="link-url"
                        v-model="linkForm.url"
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-logo">{{ tt('components.friend_links.fields.logo') }}</label>
                    <!-- 跨边界展示型壳过渡组件（迁移方案 §5.5）：按路由择库，已迁移路由渲染 caomei 版。 -->
                    <AppUploaderV2
                        id="link-logo"
                        v-model="linkForm.logo"
                        :type="UploadType.IMAGE"
                        :placeholder="tt('pages.admin.friend_links.logo_placeholder')"
                        accept="image/*"
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-rss">{{ tt('components.friend_links.fields.rss_url') }}</label>
                    <CaomeiInput
                        id="link-rss"
                        v-model="linkForm.rssUrl"
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-email">{{ tt('components.friend_links.fields.contact_email') }} *</label>
                    <CaomeiInput
                        id="link-email"
                        v-model="linkForm.contactEmail"
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-category">{{ $t('common.category') }}</label>
                    <CaomeiSelect
                        id="link-category"
                        v-model="linkForm.categoryId"
                        :options="categories"
                        option-label="name"
                        option-value="id"
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-status">{{ tt('pages.admin.friend_links.link_status') }}</label>
                    <CaomeiSelect
                        id="link-status"
                        v-model="linkForm.status"
                        :options="linkStatusOptions"
                        option-label="label"
                        option-value="value"
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-sort">{{ tt('pages.admin.friend_links.sort_order') }}</label>
                    <!-- `InputNumber` 不在 B2 在册族（迁移方案 §5.5）：随 B3 表单批次迁移。 -->
                    <InputNumber
                        id="link-sort"
                        v-model="linkForm.sortOrder"
                        :min="0"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field admin-friend-links__field--full">
                    <label for="link-description">{{ $t('common.description') }}</label>
                    <Textarea
                        id="link-description"
                        v-model="linkForm.description"
                        rows="4"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__toggles">
                    <div class="admin-friend-links__toggle">
                        <Checkbox
                            v-model="linkForm.isFeatured"
                            :binary="true"
                            input-id="link-featured"
                        />
                        <label for="link-featured">{{ tt('pages.admin.friend_links.is_featured') }}</label>
                    </div>
                    <div class="admin-friend-links__toggle">
                        <Checkbox
                            v-model="linkForm.isPinned"
                            :binary="true"
                            input-id="link-pinned"
                        />
                        <label for="link-pinned">{{ tt('pages.admin.friend_links.is_pinned') }}</label>
                    </div>
                    <div class="admin-friend-links__toggle">
                        <Checkbox
                            v-model="linkForm.showRssFeed"
                            :binary="true"
                            input-id="link-show-rss"
                        />
                        <label for="link-show-rss">{{ tt('pages.admin.friend_links.show_rss_feed') }}</label>
                    </div>
                </div>
            </div>
            <template #footer>
                <CaomeiButton
                    variant="ghost"
                    tone="neutral"
                    @click="linkDialogVisible = false"
                >
                    {{ $t('common.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    :loading="saving"
                    @click="saveLink"
                >
                    {{ $t('common.save') }}
                </CaomeiButton>
            </template>
        </Dialog>

        <Dialog
            v-model:visible="categoryDialogVisible"
            :header="editingCategory ? tt('pages.admin.friend_links.edit_category') : tt('pages.admin.friend_links.create_category')"
            modal
            class="admin-friend-links__dialog"
        >
            <div class="admin-friend-links__form">
                <div class="admin-friend-links__field">
                    <label for="category-name">{{ $t('common.name') }}</label>
                    <CaomeiInput
                        id="category-name"
                        v-model="categoryForm.name"
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="category-slug">{{ $t('common.slug') }}</label>
                    <CaomeiInput
                        id="category-slug"
                        v-model="categoryForm.slug"
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="category-sort">{{ tt('pages.admin.friend_links.sort_order') }}</label>
                    <InputNumber
                        id="category-sort"
                        v-model="categoryForm.sortOrder"
                        :min="0"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field admin-friend-links__field--full">
                    <label for="category-description">{{ $t('common.description') }}</label>
                    <Textarea
                        id="category-description"
                        v-model="categoryForm.description"
                        rows="4"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__toggle">
                    <Checkbox
                        v-model="categoryForm.isEnabled"
                        :binary="true"
                        input-id="category-enabled"
                    />
                    <label for="category-enabled">{{ tt('pages.admin.friend_links.enabled') }}</label>
                </div>
            </div>
            <template #footer>
                <CaomeiButton
                    variant="ghost"
                    tone="neutral"
                    @click="categoryDialogVisible = false"
                >
                    {{ $t('common.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    :loading="saving"
                    @click="saveCategory"
                >
                    {{ $t('common.save') }}
                </CaomeiButton>
            </template>
        </Dialog>

        <Dialog
            v-model:visible="reviewDialogVisible"
            :header="tt('pages.admin.friend_links.review_application')"
            modal
            class="admin-friend-links__dialog admin-friend-links__dialog--wide"
        >
            <div v-if="selectedApplication" class="admin-friend-links__review">
                <div class="admin-friend-links__review-grid">
                    <div><strong>{{ $t('common.name') }}:</strong> {{ selectedApplication.name }}</div>
                    <div><strong>{{ tt('components.friend_links.fields.contact_email') }}:</strong> {{ selectedApplication.contactEmail }}</div>
                    <div v-if="selectedApplication.applicant">
                        <strong>{{ tt('pages.admin.friend_links.applicant_account') }}:</strong> {{ selectedApplication.applicant.name || selectedApplication.applicant.email || selectedApplication.applicant.id }}
                    </div>
                    <div><strong>{{ tt('components.friend_links.fields.site_url') }}:</strong> {{ selectedApplication.url }}</div>
                    <div><strong>{{ tt('pages.admin.friend_links.reciprocal_url') }}:</strong> {{ selectedApplication.reciprocalUrl || '-' }}</div>
                    <div><strong>{{ tt('pages.admin.friend_links.submitted_ip') }}:</strong> {{ selectedApplication.submittedIp || '-' }}</div>
                    <div><strong>{{ $t('common.created_at') }}:</strong> {{ formatDateTime(selectedApplication.createdAt) }}</div>
                </div>

                <div class="admin-friend-links__field admin-friend-links__field--full">
                    <label for="review-note">{{ tt('pages.admin.friend_links.review_note') }}</label>
                    <Textarea
                        id="review-note"
                        v-model="reviewForm.reviewNote"
                        rows="4"
                        fluid
                    />
                </div>

                <div class="admin-friend-links__review-options">
                    <div class="admin-friend-links__field">
                        <label for="review-category">{{ $t('common.category') }}</label>
                        <CaomeiSelect
                            id="review-category"
                            v-model="reviewForm.linkData.categoryId"
                            :options="categories"
                            option-label="name"
                            option-value="id"
                        />
                    </div>
                    <div class="admin-friend-links__field">
                        <label for="review-sort">{{ tt('pages.admin.friend_links.sort_order') }}</label>
                        <InputNumber
                            id="review-sort"
                            v-model="reviewForm.linkData.sortOrder"
                            :min="0"
                            fluid
                        />
                    </div>
                </div>

                <div class="admin-friend-links__toggles">
                    <div class="admin-friend-links__toggle">
                        <Checkbox
                            v-model="reviewForm.linkData.isFeatured"
                            :binary="true"
                            input-id="review-featured"
                        />
                        <label for="review-featured">{{ tt('pages.admin.friend_links.is_featured') }}</label>
                    </div>
                    <div class="admin-friend-links__toggle">
                        <Checkbox
                            v-model="reviewForm.linkData.isPinned"
                            :binary="true"
                            input-id="review-pinned"
                        />
                        <label for="review-pinned">{{ tt('pages.admin.friend_links.is_pinned') }}</label>
                    </div>
                </div>
            </div>
            <template #footer>
                <CaomeiButton
                    variant="ghost"
                    tone="neutral"
                    @click="reviewDialogVisible = false"
                >
                    {{ $t('common.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    tone="danger"
                    :loading="saving"
                    @click="submitReview('rejected')"
                >
                    {{ tt('pages.admin.friend_links.reject') }}
                </CaomeiButton>
                <CaomeiButton
                    tone="success"
                    :loading="saving"
                    @click="submitReview('approved')"
                >
                    {{ tt('pages.admin.friend_links.approve') }}
                </CaomeiButton>
            </template>
        </Dialog>

        <ConfirmDialog />
        <Toast />
    </div>
</template>

<script setup lang="ts">
import { Eye, Pencil, Plus, RefreshCw, Trash2, TriangleAlert } from '@lucide/vue'
import type { DataTableColumn } from 'caomei-ui'
import { UploadType } from '@/composables/use-upload'
import type { FriendLinkApplication, FriendLinkCategory, FriendLinkItem } from '@/composables/use-admin-friend-links-page'
import { FriendLinkApplicationStatus, FriendLinkHealthStatus } from '@/types/friend-link'

definePageMeta({
    middleware: 'admin',
})

const friendLinkHealthStatusLabelKeyMap: Record<FriendLinkHealthStatus, 'pages.admin.friend_links.health_statuses.checking' | 'pages.admin.friend_links.health_statuses.healthy' | 'pages.admin.friend_links.health_statuses.unknown' | 'pages.admin.friend_links.health_statuses.unreachable'> = {
    [FriendLinkHealthStatus.CHECKING]: 'pages.admin.friend_links.health_statuses.checking',
    [FriendLinkHealthStatus.HEALTHY]: 'pages.admin.friend_links.health_statuses.healthy',
    [FriendLinkHealthStatus.UNKNOWN]: 'pages.admin.friend_links.health_statuses.unknown',
    [FriendLinkHealthStatus.UNREACHABLE]: 'pages.admin.friend_links.health_statuses.unreachable',
}

const friendLinkApplicationStatusLabelKeyMap: Record<FriendLinkApplicationStatus, 'pages.admin.friend_links.application_statuses.approved' | 'pages.admin.friend_links.application_statuses.archived' | 'pages.admin.friend_links.application_statuses.pending' | 'pages.admin.friend_links.application_statuses.rejected'> = {
    [FriendLinkApplicationStatus.APPROVED]: 'pages.admin.friend_links.application_statuses.approved',
    [FriendLinkApplicationStatus.ARCHIVED]: 'pages.admin.friend_links.application_statuses.archived',
    [FriendLinkApplicationStatus.PENDING]: 'pages.admin.friend_links.application_statuses.pending',
    [FriendLinkApplicationStatus.REJECTED]: 'pages.admin.friend_links.application_statuses.rejected',
}

function getFriendLinkHealthStatusLabelKey(status: string | null | undefined) {
    return friendLinkHealthStatusLabelKeyMap[(status as FriendLinkHealthStatus) || FriendLinkHealthStatus.UNKNOWN]
}

function getFriendLinkApplicationStatusLabelKey(status: string) {
    return friendLinkApplicationStatusLabelKeyMap[status as FriendLinkApplicationStatus]
}

const {
    tt,
    loading,
    saving,
    links,
    categories,
    applications,
    linkDialogVisible,
    categoryDialogVisible,
    reviewDialogVisible,
    editingLink,
    editingCategory,
    selectedApplication,
    linkForm,
    categoryForm,
    reviewForm,
    linkStatusOptions,
    getLinkStatusTone,
    getHealthStatusTone,
    getApplicationStatusTone,
    formatDateTime,
    shouldSuggestReviewOrDisable,
    loadLinks,
    openLinkDialog,
    saveLink,
    confirmDeleteLink,
    openCategoryDialog,
    saveCategory,
    confirmDeleteCategory,
    openReviewDialog,
    submitReview,
    confirmReviewOrDisable,
} = useAdminFriendLinksPage()

// 三个表格的列定义与迁移前 PrimeVue 列组件一一对应：有 `field` 的列沿用字段名作 key
// （含 `isFeatured` / `isPinned` / `isEnabled` 等布尔字段），无 `field` 的列按插槽语义命名
// （`category` / `actions`）。
// 迁移前各表均未声明 `sortable`、未接 `@sort`，故迁移后同样不声明（保持客户端默认行为一致）。
const linkColumns = computed<DataTableColumn<FriendLinkItem>[]>(() => [
    { key: 'name', header: tt('common.name') },
    { key: 'url', header: tt('components.friend_links.fields.site_url') },
    { key: 'category', header: tt('common.category') },
    { key: 'status', header: tt('pages.admin.friend_links.link_status') },
    { key: 'healthStatus', header: tt('pages.admin.friend_links.health_status') },
    { key: 'isFeatured', header: tt('pages.admin.friend_links.featured') },
    { key: 'isPinned', header: tt('pages.admin.friend_links.pinned') },
    { key: 'sortOrder', header: tt('pages.admin.friend_links.sort_order') },
    { key: 'lastCheckedAt', header: tt('pages.admin.friend_links.last_checked_at') },
    { key: 'actions', header: tt('common.actions') },
])

const categoryColumns = computed<DataTableColumn<FriendLinkCategory>[]>(() => [
    { key: 'name', header: tt('common.name') },
    { key: 'slug', header: tt('common.slug') },
    { key: 'sortOrder', header: tt('pages.admin.friend_links.sort_order') },
    { key: 'isEnabled', header: tt('pages.admin.friend_links.category_status') },
    { key: 'actions', header: tt('common.actions') },
])

const applicationColumns = computed<DataTableColumn<FriendLinkApplication>[]>(() => [
    { key: 'name', header: tt('common.name') },
    { key: 'contactEmail', header: tt('components.friend_links.fields.contact_email') },
    { key: 'submittedIp', header: tt('pages.admin.friend_links.submitted_ip') },
    { key: 'createdAt', header: tt('common.created_at') },
    { key: 'status', header: tt('pages.admin.friend_links.application_status') },
    { key: 'actions', header: tt('common.actions') },
])
</script>

<style scoped src="@/styles/pages/admin-friend-links.scss" lang="scss"></style>
