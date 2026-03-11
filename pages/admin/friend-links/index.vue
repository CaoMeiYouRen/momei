<template>
    <div class="admin-friend-links page-container">
        <AdminPageHeader :title="tt('pages.admin.friend_links.title')">
            <template #actions>
                <div class="admin-friend-links__header-actions">
                    <Button
                        :label="tt('pages.admin.friend_links.create_category')"
                        severity="secondary"
                        @click="openCategoryDialog()"
                    />
                    <Button
                        :label="tt('pages.admin.friend_links.create_link')"
                        icon="pi pi-plus"
                        @click="openLinkDialog()"
                    />
                </div>
            </template>
        </AdminPageHeader>

        <div class="admin-friend-links__section">
            <div class="admin-friend-links__section-header">
                <h2>{{ tt('pages.admin.friend_links.links') }}</h2>
                <Button
                    text
                    icon="pi pi-refresh"
                    @click="loadLinks"
                />
            </div>

            <DataTable
                :value="links"
                :loading="loading.links"
                class="admin-friend-links__table"
            >
                <Column field="name" :header="$t('common.name')" />
                <Column field="url" :header="tt('pages.admin.friend_links.site_url')">
                    <template #body="{data}">
                        <a
                            :href="data.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="admin-friend-links__external-link"
                        >
                            {{ data.url }}
                        </a>
                    </template>
                </Column>
                <Column :header="$t('common.category')">
                    <template #body="{data}">
                        {{ data.category?.name || tt('pages.links.uncategorized') }}
                    </template>
                </Column>
                <Column field="status" :header="tt('pages.admin.friend_links.link_status')">
                    <template #body="{data}">
                        <Tag :value="tt(`pages.admin.friend_links.statuses.${data.status}`)" :severity="getLinkStatusSeverity(data.status)" />
                    </template>
                </Column>
                <Column field="healthStatus" :header="tt('pages.admin.friend_links.health_status')">
                    <template #body="{data}">
                        <Tag :value="tt(`pages.admin.friend_links.health_statuses.${data.healthStatus || 'unknown'}`)" :severity="getHealthStatusSeverity(data.healthStatus)" />
                    </template>
                </Column>
                <Column :header="tt('pages.admin.friend_links.featured')">
                    <template #body="{data}">
                        <Tag :value="data.isFeatured ? $t('common.yes') : $t('common.no')" :severity="data.isFeatured ? 'success' : 'secondary'" />
                    </template>
                </Column>
                <Column :header="tt('pages.admin.friend_links.pinned')">
                    <template #body="{data}">
                        <Tag :value="data.isPinned ? $t('common.yes') : $t('common.no')" :severity="data.isPinned ? 'info' : 'secondary'" />
                    </template>
                </Column>
                <Column field="sortOrder" :header="tt('pages.admin.friend_links.sort_order')" />
                <Column field="lastCheckedAt" :header="tt('pages.admin.friend_links.last_checked_at')">
                    <template #body="{data}">
                        {{ formatDate(data.lastCheckedAt) }}
                    </template>
                </Column>
                <Column :header="$t('common.actions')">
                    <template #body="{data}">
                        <div class="admin-friend-links__actions">
                            <Button
                                v-if="shouldSuggestReviewOrDisable(data)"
                                :label="tt('pages.admin.friend_links.suggest_review_or_disable')"
                                icon="pi pi-exclamation-triangle"
                                text
                                size="small"
                                severity="warning"
                                @click="confirmReviewOrDisable(data)"
                            />
                            <Button
                                icon="pi pi-pencil"
                                text
                                rounded
                                severity="info"
                                @click="openLinkDialog(data)"
                            />
                            <Button
                                icon="pi pi-trash"
                                text
                                rounded
                                severity="danger"
                                @click="confirmDeleteLink(data)"
                            />
                        </div>
                    </template>
                </Column>
                <template #empty>
                    <div class="admin-friend-links__empty">
                        {{ tt('pages.admin.friend_links.empty_links') }}
                    </div>
                </template>
            </DataTable>
        </div>

        <div class="admin-friend-links__split">
            <section class="admin-friend-links__section admin-friend-links__section--half">
                <div class="admin-friend-links__section-header">
                    <h2>{{ tt('pages.admin.friend_links.categories') }}</h2>
                </div>

                <DataTable
                    :value="categories"
                    :loading="loading.categories"
                    class="admin-friend-links__table"
                >
                    <Column field="name" :header="$t('common.name')" />
                    <Column field="slug" :header="$t('common.slug')" />
                    <Column field="sortOrder" :header="tt('pages.admin.friend_links.sort_order')" />
                    <Column :header="tt('pages.admin.friend_links.category_status')">
                        <template #body="{data}">
                            <Tag :value="data.isEnabled ? tt('pages.admin.friend_links.enabled') : tt('pages.admin.friend_links.disabled')" :severity="data.isEnabled ? 'success' : 'secondary'" />
                        </template>
                    </Column>
                    <Column :header="$t('common.actions')">
                        <template #body="{data}">
                            <div class="admin-friend-links__actions">
                                <Button
                                    icon="pi pi-pencil"
                                    text
                                    rounded
                                    severity="info"
                                    @click="openCategoryDialog(data)"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    text
                                    rounded
                                    severity="danger"
                                    @click="confirmDeleteCategory(data)"
                                />
                            </div>
                        </template>
                    </Column>
                    <template #empty>
                        <div class="admin-friend-links__empty">
                            {{ tt('pages.admin.friend_links.empty_categories') }}
                        </div>
                    </template>
                </DataTable>
            </section>

            <section class="admin-friend-links__section admin-friend-links__section--half">
                <div class="admin-friend-links__section-header">
                    <h2>{{ tt('pages.admin.friend_links.applications') }}</h2>
                </div>

                <DataTable
                    :value="applications"
                    :loading="loading.applications"
                    class="admin-friend-links__table"
                >
                    <Column field="name" :header="$t('common.name')" />
                    <Column field="contactEmail" :header="tt('pages.admin.friend_links.contact_email')" />
                    <Column field="submittedIp" :header="tt('pages.admin.friend_links.submitted_ip')" />
                    <Column field="createdAt" :header="$t('common.created_at')">
                        <template #body="{data}">
                            {{ formatDate(data.createdAt) }}
                        </template>
                    </Column>
                    <Column field="status" :header="tt('pages.admin.friend_links.application_status')">
                        <template #body="{data}">
                            <Tag :value="tt(`pages.admin.friend_links.application_statuses.${data.status}`)" :severity="getApplicationStatusSeverity(data.status)" />
                        </template>
                    </Column>
                    <Column :header="$t('common.actions')">
                        <template #body="{data}">
                            <div class="admin-friend-links__actions">
                                <Button
                                    icon="pi pi-eye"
                                    text
                                    rounded
                                    severity="info"
                                    @click="openReviewDialog(data)"
                                />
                            </div>
                        </template>
                    </Column>
                    <template #empty>
                        <div class="admin-friend-links__empty">
                            {{ tt('pages.admin.friend_links.empty_applications') }}
                        </div>
                    </template>
                </DataTable>
            </section>
        </div>

        <Dialog
            v-model:visible="linkDialogVisible"
            :header="editingLink ? tt('pages.admin.friend_links.edit_link') : tt('pages.admin.friend_links.create_link')"
            modal
            class="admin-friend-links__dialog"
        >
            <div class="admin-friend-links__form">
                <div class="admin-friend-links__field">
                    <label for="link-name">{{ $t('common.name') }} *</label>
                    <InputText
                        id="link-name"
                        v-model="linkForm.name"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-url">{{ tt('pages.admin.friend_links.site_url') }} *</label>
                    <InputText
                        id="link-url"
                        v-model="linkForm.url"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-logo">{{ tt('pages.admin.friend_links.logo') }}</label>
                    <AppUploader
                        id="link-logo"
                        v-model="linkForm.logo"
                        :type="UploadType.IMAGE"
                        :placeholder="tt('pages.admin.friend_links.logo_placeholder')"
                        accept="image/*"
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-rss">{{ tt('pages.admin.friend_links.rss_url') }}</label>
                    <InputText
                        id="link-rss"
                        v-model="linkForm.rssUrl"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-email">{{ tt('pages.admin.friend_links.contact_email') }} *</label>
                    <InputText
                        id="link-email"
                        v-model="linkForm.contactEmail"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-category">{{ $t('common.category') }}</label>
                    <Select
                        id="link-category"
                        v-model="linkForm.categoryId"
                        :options="categories"
                        option-label="name"
                        option-value="id"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-status">{{ tt('pages.admin.friend_links.link_status') }}</label>
                    <Select
                        id="link-status"
                        v-model="linkForm.status"
                        :options="linkStatusOptions"
                        option-label="label"
                        option-value="value"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="link-sort">{{ tt('pages.admin.friend_links.sort_order') }}</label>
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
                </div>
            </div>
            <template #footer>
                <Button
                    :label="$t('common.cancel')"
                    text
                    @click="linkDialogVisible = false"
                />
                <Button
                    :label="$t('common.save')"
                    :loading="saving"
                    @click="saveLink"
                />
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
                    <InputText
                        id="category-name"
                        v-model="categoryForm.name"
                        fluid
                    />
                </div>
                <div class="admin-friend-links__field">
                    <label for="category-slug">{{ $t('common.slug') }}</label>
                    <InputText
                        id="category-slug"
                        v-model="categoryForm.slug"
                        fluid
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
                <Button
                    :label="$t('common.cancel')"
                    text
                    @click="categoryDialogVisible = false"
                />
                <Button
                    :label="$t('common.save')"
                    :loading="saving"
                    @click="saveCategory"
                />
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
                    <div><strong>{{ tt('pages.admin.friend_links.contact_email') }}:</strong> {{ selectedApplication.contactEmail }}</div>
                    <div v-if="selectedApplication.applicant">
                        <strong>{{ tt('pages.admin.friend_links.applicant_account') }}:</strong> {{ selectedApplication.applicant.name || selectedApplication.applicant.email || selectedApplication.applicant.id }}
                    </div>
                    <div><strong>{{ tt('pages.admin.friend_links.site_url') }}:</strong> {{ selectedApplication.url }}</div>
                    <div><strong>{{ tt('pages.admin.friend_links.reciprocal_url') }}:</strong> {{ selectedApplication.reciprocalUrl || '-' }}</div>
                    <div><strong>{{ tt('pages.admin.friend_links.submitted_ip') }}:</strong> {{ selectedApplication.submittedIp || '-' }}</div>
                    <div><strong>{{ $t('common.created_at') }}:</strong> {{ formatDate(selectedApplication.createdAt) }}</div>
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
                        <Select
                            id="review-category"
                            v-model="reviewForm.linkData.categoryId"
                            :options="categories"
                            option-label="name"
                            option-value="id"
                            fluid
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
                <Button
                    :label="$t('common.cancel')"
                    text
                    @click="reviewDialogVisible = false"
                />
                <Button
                    :label="tt('pages.admin.friend_links.reject')"
                    severity="danger"
                    :loading="saving"
                    @click="submitReview('rejected')"
                />
                <Button
                    :label="tt('pages.admin.friend_links.approve')"
                    severity="success"
                    :loading="saving"
                    @click="submitReview('approved')"
                />
            </template>
        </Dialog>

        <ConfirmDialog />
        <Toast />
    </div>
</template>

<script setup lang="ts">
import { UploadType } from '@/composables/use-upload'

definePageMeta({
    middleware: 'admin',
})

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
    getLinkStatusSeverity,
    getHealthStatusSeverity,
    getApplicationStatusSeverity,
    formatDate,
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
</script>

<style scoped src="@/styles/pages/admin-friend-links.scss" lang="scss"></style>
