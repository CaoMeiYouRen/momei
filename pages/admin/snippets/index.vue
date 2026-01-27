<template>
    <div class="admin-snippets-page">
        <AdminPageHeader :title="t('pages.admin.snippets.title')">
            <template #actions>
                <div class="header-actions">
                    <transition name="fade">
                        <span v-if="selectedSnippetIds.length" class="selected-count">
                            {{ t('pages.admin.snippets.selected_count', {count: selectedSnippetIds.length}) }}
                        </span>
                    </transition>
                    <Button
                        v-tooltip.bottom="t('pages.admin.snippets.aggregate_hint')"
                        :label="t('pages.admin.snippets.aggregate')"
                        icon="pi pi-sparkles"
                        severity="help"
                        :disabled="!selectedSnippetIds.length"
                        @click="showAggregateDialog = true"
                    />
                </div>
            </template>
        </AdminPageHeader>

        <div class="quick-capture-wrapper">
            <Card class="quick-capture-card">
                <template #content>
                    <div class="quick-capture-content">
                        <div class="quick-capture-header">
                            <i class="pi pi-pencil text-primary" />
                            <span class="quick-capture-title">{{ t('pages.admin.snippets.quick_capture_title') }}</span>
                        </div>
                        <Textarea
                            v-model="newSnippet"
                            rows="2"
                            :placeholder="t('pages.admin.snippets.quick_capture_placeholder')"
                            class="quick-capture-input"
                            auto-resize
                            @keydown.ctrl.enter="saveSnippet"
                        />

                        <div v-if="pendingMedia.length" class="pending-media">
                            <div
                                v-for="(url, index) in pendingMedia"
                                :key="index"
                                class="media-item"
                            >
                                <Image
                                    :src="url"
                                    width="64"
                                    preview
                                />
                                <Button
                                    icon="pi pi-times"
                                    severity="danger"
                                    rounded
                                    text
                                    size="small"
                                    class="remove-btn"
                                    @click="removeMedia(index)"
                                />
                            </div>
                        </div>

                        <Divider class="quick-capture-divider" />
                        <div class="quick-capture-footer">
                            <div class="footer-left">
                                <Button
                                    v-tooltip.bottom="t('pages.admin.snippets.upload_image')"
                                    :loading="imageUploading"
                                    icon="pi pi-image"
                                    text
                                    rounded
                                    severity="secondary"
                                    @click="triggerUpload"
                                />
                                <input
                                    ref="fileInput"
                                    type="file"
                                    style="display: none"
                                    accept="image/*"
                                    multiple
                                    @change="onFileChange"
                                >
                            </div>
                            <div class="footer-right">
                                <span class="shortcut-tip">Ctrl + Enter</span>
                                <Button
                                    :label="t('common.save')"
                                    icon="pi pi-send"
                                    class="save-btn"
                                    :loading="saving"
                                    :disabled="!newSnippet.trim() && !pendingMedia.length"
                                    @click="saveSnippet"
                                />
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>

        <div class="tools-section">
            <Accordion>
                <AccordionPanel value="bookmarklet">
                    <AccordionHeader>
                        <div class="flex gap-2 items-center">
                            <i class="pi pi-bookmark" />
                            <span>{{ t('pages.admin.snippets.bookmarklet_title') }}</span>
                        </div>
                    </AccordionHeader>
                    <AccordionContent>
                        <div class="bookmarklet-content">
                            <p class="bookmarklet-desc">
                                {{ t('pages.admin.snippets.bookmarklet_desc') }}
                            </p>
                            <div class="bookmarklet-actions">
                                <a
                                    :href="bookmarkletCode"
                                    class="bookmarklet-link-btn"
                                    @click.prevent
                                >
                                    <i class="pi pi-bookmark" />
                                    <span>{{ t('pages.admin.snippets.bookmarklet_button') }}</span>
                                </a>
                                <Button
                                    icon="pi pi-copy"
                                    :label="t('common.copy_code')"
                                    text
                                    size="small"
                                    @click="copyBookmarklet"
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionPanel>
            </Accordion>
        </div>

        <div class="snippets-container">
            <div v-if="loading && !items.length" class="loading-state">
                <i class="pi pi-spin pi-spinner" />
                <p class="loading-text">
                    {{ t('common.loading') }}
                </p>
            </div>

            <div v-else-if="!items.length" class="empty-state">
                <i class="empty-icon pi pi-inbox" />
                <p class="empty-main-text">
                    {{ t('pages.admin.snippets.empty') }}
                </p>
                <p class="empty-sub-text">
                    {{ t('pages.admin.snippets.empty_hint') }}
                </p>
            </div>

            <template v-else>
                <transition-group
                    name="snippet-list"
                    tag="div"
                    class="snippets-grid"
                >
                    <div
                        v-for="item in items"
                        :key="item.id"
                        class="snippet-item-wrapper"
                    >
                        <div class="checkbox-wrapper">
                            <Checkbox
                                v-model="selectedSnippetIds"
                                :value="item.id"
                            />
                        </div>
                        <SnippetCard
                            :snippet="item"
                            class="snippet-card-item"
                            @edit="editSnippet"
                            @delete="confirmDelete"
                            @convert="convertSnippet"
                        />
                    </div>
                </transition-group>

                <div class="pagination-wrapper">
                    <Paginator
                        v-model:first="paginatorFirst"
                        :rows="pagination.limit"
                        :total-records="pagination.total"
                        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                        class="paginator-custom"
                        @page="onPageChange"
                    />
                </div>
            </template>
        </div>

        <!-- Aggregate Dialog -->
        <Dialog
            v-model:visible="showAggregateDialog"
            :header="t('pages.admin.snippets.aggregate')"
            modal
            class="aggregate-dialog"
            dismissable-mask
            :style="{width: '50vw'}"
            :breakpoints="{'1199px': '75vw', '575px': '90vw'}"
        >
            <div v-if="aggregating" class="aggregating-state">
                <ProgressSpinner stroke-width="3" class="spinner" />
                <p class="aggregating-text">
                    AI {{ t('pages.admin.snippets.ai_thinking') }}
                </p>
            </div>
            <div v-else-if="scaffold" class="scaffold-preview-container">
                <div class="scaffold-header">
                    <h3 class="scaffold-title">
                        <i class="pi pi-sparkles" />
                        {{ t('pages.admin.snippets.ai_scaffold') }}
                    </h3>
                    <div class="flex gap-2">
                        <Button
                            icon="pi pi-refresh"
                            text
                            size="small"
                            :label="t('common.regenerate')"
                            @click="scaffold = ''"
                        />
                        <Button
                            icon="pi pi-copy"
                            text
                            size="small"
                            :label="t('common.copy')"
                            @click="copyScaffold"
                        />
                    </div>
                </div>
                <div class="dark:prose-invert prose scaffold-content-box">
                    <!-- eslint-disable vue/no-v-html -->
                    <div v-html="renderMarkdown(scaffold)" />
                </div>

                <!-- Expansion Tool -->
                <div class="expansion-tool">
                    <Divider />
                    <h4 class="expansion-title">
                        <i class="pi pi-search-plus" />
                        {{ t('pages.admin.snippets.expand_section') }}
                    </h4>
                    <div class="expansion-fields">
                        <div class="field-item">
                            <label>{{ t('common.title') }}</label>
                            <InputText
                                v-model="expansionForm.sectionTitle"
                                :placeholder="t('pages.admin.snippets.expand_title')"
                                class="field-input"
                            />
                        </div>
                        <div class="field-item">
                            <label>{{ t('pages.admin.snippets.expand_type') }}</label>
                            <Dropdown
                                v-model="expansionForm.expandType"
                                :options="expandTypeOptions"
                                option-label="label"
                                option-value="value"
                                class="field-input"
                            />
                        </div>
                        <div class="field-item full-width">
                            <Button
                                :label="t('pages.admin.snippets.expand_btn')"
                                icon="pi pi-bolt"
                                class="expand-action-btn"
                                :loading="expandingSection"
                                :disabled="!expansionForm.sectionTitle.trim()"
                                @click="performExpand"
                            />
                        </div>
                    </div>

                    <transition name="fade">
                        <div v-if="expansionResult" class="expansion-result-box">
                            <div class="result-header">
                                <span>{{ t('pages.admin.snippets.expansion_result') }}</span>
                                <Button
                                    icon="pi pi-copy"
                                    text
                                    size="small"
                                    :label="t('pages.admin.snippets.apply_expansion')"
                                    @click="applyExpansion"
                                />
                            </div>
                            <div class="dark:prose-invert prose result-content">
                                <div v-html="renderMarkdown(expansionResult)" />
                            </div>
                        </div>
                    </transition>
                </div>

                <div class="dialog-actions-footer">
                    <Button
                        :label="t('common.close')"
                        text
                        severity="secondary"
                        @click="showAggregateDialog = false; scaffold = ''"
                    />
                    <Button
                        :label="t('pages.admin.snippets.convert_to_post')"
                        icon="pi pi-file-export"
                        severity="primary"
                        @click="convertToPostFromScaffold"
                    />
                </div>
            </div>
            <div v-else class="aggregate-options">
                <div class="mode-selector">
                    <SelectButton
                        v-model="aggregateMode"
                        :options="[
                            {label: t('pages.admin.snippets.mode_snippets'), value: 'snippets'},
                            {label: t('pages.admin.snippets.mode_topic'), value: 'topic'}
                        ]"
                        option-label="label"
                        option-value="value"
                        aria-labelledby="basic"
                    />
                </div>

                <div class="options-form">
                    <div v-if="aggregateMode === 'topic'" class="option-field">
                        <label class="field-label">{{ t('pages.admin.snippets.topic') }}</label>
                        <InputText
                            v-model="aggregateForm.topic"
                            class="field-input"
                            :placeholder="t('pages.admin.snippets.topic_placeholder')"
                        />
                    </div>

                    <div v-if="aggregateMode === 'snippets'" class="compact info-alert">
                        <i class="pi pi-info-circle" />
                        <span>{{ t('pages.admin.snippets.aggregate_hint_detailed', {count: selectedSnippetIds.length}) }}</span>
                    </div>

                    <div class="option-row">
                        <div class="option-field">
                            <label class="field-label">{{ t('pages.admin.snippets.template') }}</label>
                            <Dropdown
                                v-model="aggregateForm.template"
                                :options="templateOptions"
                                option-label="label"
                                option-value="value"
                                class="field-input"
                            />
                        </div>
                        <div class="option-field">
                            <label class="field-label">{{ t('pages.admin.snippets.section_count') }}</label>
                            <InputNumber
                                v-model="aggregateForm.sectionCount"
                                show-buttons
                                :min="3"
                                :max="8"
                                class="field-input"
                            />
                        </div>
                    </div>

                    <div class="option-field">
                        <label class="field-label">{{ t('pages.admin.snippets.audience') }}</label>
                        <SelectButton
                            v-model="aggregateForm.audience"
                            :options="audienceOptions"
                            option-label="label"
                            option-value="value"
                            class="field-select-button"
                        />
                    </div>

                    <div class="inline-field option-field">
                        <Checkbox
                            id="intro-conclusion"
                            v-model="aggregateForm.includeIntroConclusion"
                            binary
                        />
                        <label for="intro-conclusion" class="inline-label">{{ t('pages.admin.snippets.include_intro_conclusion') }}</label>
                    </div>
                </div>

                <Divider />

                <div class="dialog-actions">
                    <Button
                        :label="t('common.cancel')"
                        text
                        severity="secondary"
                        @click="showAggregateDialog = false"
                    />
                    <Button
                        :label="t('pages.admin.snippets.generate_scaffold')"
                        icon="pi pi-sparkles"
                        severity="primary"
                        :loading="aggregating"
                        @click="performAggregate"
                    />
                </div>
            </div>
        </Dialog>

        <!-- Edit Dialog -->
        <Dialog
            v-model:visible="editDialogVisible"
            :header="t('pages.admin.snippets.edit')"
            modal
            class="edit-dialog"
            dismissable-mask
        >
            <div class="edit-form">
                <div class="edit-field">
                    <label for="content" class="field-label">{{ t('pages.admin.snippets.content') }}</label>
                    <Textarea
                        id="content"
                        v-model="editForm.content"
                        rows="10"
                        auto-resize
                        class="edit-textarea field-input"
                    />
                </div>
                <div class="edit-field">
                    <label for="status" class="field-label">{{ t('pages.admin.snippets.status') }}</label>
                    <Dropdown
                        id="status"
                        v-model="editForm.status"
                        :options="statusOptions"
                        option-label="label"
                        option-value="value"
                        class="field-input"
                    />
                </div>
            </div>
            <template #footer>
                <div class="edit-dialog-footer">
                    <Button
                        :label="t('common.cancel')"
                        text
                        severity="secondary"
                        @click="editDialogVisible = false"
                    />
                    <Button
                        :label="t('common.save')"
                        icon="pi pi-check"
                        :loading="saving"
                        @click="updateSnippet"
                    />
                </div>
            </template>
        </Dialog>

        <ConfirmDeleteDialog
            v-model:visible="deleteDialogVisible"
            :title="t('pages.admin.snippets.confirm_delete')"
            @confirm="deleteSnippet"
        />
    </div>
</template>

<script setup lang="ts">
import { useAdminList } from '@/composables/use-admin-list'
import SnippetCard from '@/components/admin/snippets/snippet-card.vue'
import type { Snippet } from '@/types/snippet'
import markdownit from 'markdown-it'
import { useUpload, UploadType } from '@/composables/use-upload'

const { t } = useI18n()
const toast = useToast()
const md = markdownit()
const { uploadFile, uploading: imageUploading } = useUpload({ type: UploadType.IMAGE })

const { items, pagination, loading, refresh, onPage } = useAdminList<Snippet>({
    url: '/api/admin/snippets',
    initialLimit: 12,
})

const newSnippet = ref('')
const pendingMedia = ref<string[]>([])
const saving = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)

const triggerUpload = () => {
    fileInput.value?.click()
}

const onFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const files = target.files
    if (!files?.length) return

    for (const file of Array.from(files)) {
        try {
            const url = await uploadFile(file)
            if (url) {
                pendingMedia.value.push(url)
            }
        } catch (e) {
            // Error handled in composable
        }
    }
    // Clear input
    target.value = ''
}

const removeMedia = (index: number) => {
    pendingMedia.value.splice(index, 1)
}

const statusOptions = computed(() => [
    { label: t('pages.admin.snippets.inbox'), value: 'inbox' },
    { label: t('pages.admin.snippets.converted'), value: 'converted' },
    { label: t('pages.admin.snippets.archived'), value: 'archived' },
])

const saveSnippet = async () => {
    if (!newSnippet.value.trim() && !pendingMedia.value.length) return
    saving.value = true
    try {
        await $fetch('/api/snippets', {
            method: 'POST',
            body: {
                content: newSnippet.value,
                source: 'web',
                media: pendingMedia.value,
            },
        } as any)
        newSnippet.value = ''
        pendingMedia.value = []
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.save_success'), life: 3000 })
        refresh()
    } catch (e: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: e.data?.message || t('common.save_failed'), life: 3000 })
    } finally {
        saving.value = false
    }
}

const selectedSnippetIds = ref<string[]>([])

const showAggregateDialog = ref(false)
const aggregating = ref(false)
const scaffold = ref('')
const scaffoldMetadata = ref<any>(null)

const aggregateMode = ref<'snippets' | 'topic'>('snippets')
const aggregateForm = ref({
    topic: '',
    template: 'blog',
    sectionCount: 5,
    audience: 'intermediate',
    includeIntroConclusion: true,
})

const expansionForm = ref({
    sectionTitle: '',
    sectionContent: '',
    expandType: 'argument' as 'argument' | 'case' | 'question' | 'reference' | 'data',
})
const expandingSection = ref(false)
const expansionResult = ref('')

const expandTypeOptions = computed(() => [
    { label: t('pages.admin.snippets.expand_argument'), value: 'argument' },
    { label: t('pages.admin.snippets.expand_case'), value: 'case' },
    { label: t('pages.admin.snippets.expand_question'), value: 'question' },
    { label: t('pages.admin.snippets.expand_reference'), value: 'reference' },
    { label: t('pages.admin.snippets.expand_data'), value: 'data' },
])

const templateOptions = computed(() => [
    { label: t('pages.admin.snippets.template_blog'), value: 'blog' },
    { label: t('pages.admin.snippets.template_tutorial'), value: 'tutorial' },
    { label: t('pages.admin.snippets.template_note'), value: 'note' },
    { label: t('pages.admin.snippets.template_report'), value: 'report' },
])

const audienceOptions = computed(() => [
    { label: t('pages.admin.snippets.audience_beginner'), value: 'beginner' },
    { label: t('pages.admin.snippets.audience_intermediate'), value: 'intermediate' },
    { label: t('pages.admin.snippets.audience_advanced'), value: 'advanced' },
])

const performAggregate = async () => {
    if (aggregateMode.value === 'snippets' && selectedSnippetIds.value.length < 1) {
        toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('pages.admin.snippets.aggregate_hint'), life: 3000 })
        return
    }
    if (aggregateMode.value === 'topic' && !aggregateForm.value.topic.trim()) {
        toast.add({ severity: 'warn', summary: t('common.warn'), detail: t('pages.admin.snippets.topic_required'), life: 3000 })
        return
    }

    aggregating.value = true
    try {
        const res: any = await $fetch('/api/ai/scaffold/generate', {
            method: 'POST',
            body: {
                ...aggregateForm.value,
                snippetIds: aggregateMode.value === 'snippets' ? selectedSnippetIds.value : [],
                language: localStorage.getItem('locale') || 'zh-CN',
            },
        } as any)
        scaffold.value = res.data.scaffold
        scaffoldMetadata.value = res.data.metadata
    } catch (e: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: e.data?.message || t('common.unexpected_error'), life: 3000 })
    } finally {
        aggregating.value = false
    }
}

const performExpand = async () => {
    if (!expansionForm.value.sectionTitle.trim()) return
    expandingSection.value = true
    expansionResult.value = ''
    try {
        const currentLanguage = (useI18n().locale.value) || 'zh-CN'
        const res: any = await $fetch('/api/ai/scaffold/expand-section', {
            method: 'POST',
            body: {
                topic: aggregateMode.value === 'topic' ? aggregateForm.value.topic : (scaffoldMetadata.value?.topic || ''),
                sectionTitle: expansionForm.value.sectionTitle,
                sectionContent: expansionForm.value.sectionContent,
                expandType: expansionForm.value.expandType,
                language: currentLanguage,
            },
        } as any)
        expansionResult.value = res.data.expansion
    } catch (e: any) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: e.data?.message || t('common.unexpected_error'), life: 3000 })
    } finally {
        expandingSection.value = false
    }
}

const applyExpansion = async () => {
    if (!expansionResult.value) return
    try {
        await navigator.clipboard.writeText(expansionResult.value)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.copy_success'), life: 2000 })
        // Future: Could also append to scaffold if needed.
    } catch (err) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.copy_failed'), life: 2000 })
    }
}

const convertSnippet = async (snippet: Snippet) => {
    try {
        const res: any = await $fetch(`/api/admin/snippets/${snippet.id}/convert`, { method: 'POST' } as any)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.admin.snippets.convert_success'), life: 3000 })
        navigateTo(`/admin/posts/${res.data.post.id}`)
    } catch (e) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    }
}

const convertToPostFromScaffold = async () => {
    if (!scaffold.value) return
    aggregating.value = true
    try {
        const res: any = await $fetch('/api/admin/snippets/scaffold-to-post', {
            method: 'POST',
            body: { scaffold: scaffold.value },
        } as any)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.admin.snippets.convert_success'), life: 3000 })
        navigateTo(`/admin/posts/${res.data.post.id}`)
    } catch (e) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    } finally {
        aggregating.value = false
    }
}

const copyScaffold = async () => {
    if (!scaffold.value) return
    try {
        await navigator.clipboard.writeText(scaffold.value)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.copy_success'), life: 2000 })
    } catch (err) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.copy_failed'), life: 2000 })
    }
}

const deleteDialogVisible = ref(false)
const snippetToDelete = ref<Snippet | null>(null)

const editDialogVisible = ref(false)
const editingSnippet = ref<Snippet | null>(null)
const editForm = ref({
    content: '',
    status: '',
})

const editSnippet = (snippet: Snippet) => {
    editingSnippet.value = snippet
    editForm.value = {
        content: snippet.content || '',
        status: snippet.status || 'inbox',
    }
    editDialogVisible.value = true
}

const updateSnippet = async () => {
    if (!editingSnippet.value) return
    saving.value = true
    try {
        await $fetch(`/api/admin/snippets/${editingSnippet.value.id}`, {
            method: 'PUT',
            body: editForm.value,
        } as any)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.save_success'), life: 3000 })
        editDialogVisible.value = false
        refresh()
    } catch (e) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    } finally {
        saving.value = false
    }
}

const confirmDelete = (snippet: Snippet) => {
    snippetToDelete.value = snippet
    deleteDialogVisible.value = true
}

const deleteSnippet = async () => {
    if (!snippetToDelete.value) return
    try {
        await $fetch(`/api/admin/snippets/${snippetToDelete.value.id}`, { method: 'DELETE' } as any)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('pages.admin.snippets.delete_success'), life: 3000 })
        refresh()
    } catch (e) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.unexpected_error'), life: 3000 })
    }
}

const paginatorFirst = ref(0)
const onPageChange = (event: any) => {
    onPage(event)
    paginatorFirst.value = event.first
}

const config = useRuntimeConfig()
const bookmarkletCode = computed(() => {
    const baseUrl = config.public.siteUrl
    return `javascript:(function(){var t=document.title,u=window.location.href,c=window.getSelection().toString(),b="${baseUrl}/admin/snippets/capture",l=b+"?content="+encodeURIComponent(c)+"&url="+encodeURIComponent(u)+"&title="+encodeURIComponent(t)+"&source=bookmarklet";window.open(l,"momei_capture","width=600,height=500,location=no,menubar=no,status=no,toolbar=no")})();`
})

const copyBookmarklet = async () => {
    try {
        await navigator.clipboard.writeText(bookmarkletCode.value)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.copy_success'), life: 2000 })
    } catch (err) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.copy_failed'), life: 2000 })
    }
}

const renderMarkdown = (content: string) => md.render(content)

definePageMeta({
    layout: 'default',
})
</script>

<style lang="scss" scoped>
.admin-snippets-page {
    max-width: 1400px;
    margin: 0 auto;
    padding-bottom: 4rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;

    .header-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .selected-count {
            font-size: 0.875rem;
            color: var(--p-text-muted-color);
        }
    }

    // 定义统一样式的居中窄容器，确保展开折叠时宽度绝对稳定
    // 通过在不同分辨率下设置确定的宽度（而非仅仅 max-width）来防止内容变化导致的抖动
    %stable-centered-column {
        width: 100%; // 移动端默认 100%
        margin-left: auto;
        margin-right: auto;
        box-sizing: border-box;

        @media (width > 1280px) {
            width: 72rem;
        }

        @media (width <= 1280px) and (width > 1024px) {
            width: 64rem;
        }

        @media (width <= 1024px) and (width > 768px) {
            width: 48rem;
        }
    }

    .quick-capture-wrapper {
        @extend %stable-centered-column;

        margin-bottom: 2rem;

        .quick-capture-card {
            border-radius: 1.25rem;
            box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05);
            border: 1px solid var(--p-content-border-color);
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

            &:focus-within {
                box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -6px rgb(0 0 0 / 0.04);
                transform: translateY(-2px);
                border-color: var(--p-primary-300);
            }

            .quick-capture-content {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;

                .quick-capture-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.25rem;
                    padding: 0 0.25rem;

                    .quick-capture-title {
                        font-weight: 700;
                        font-size: 0.875rem;
                    }
                }

                .quick-capture-input {
                    width: 100%;
                    border: none;
                    background: transparent;
                    padding: 0.5rem 0;
                    font-size: 1.125rem;
                    box-shadow: none;

                    &:focus {
                        outline: none;
                    }
                }

                .pending-media {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.75rem;
                    margin: 0.5rem 0;

                    .media-item {
                        position: relative;
                        width: 64px;
                        height: 64px;
                        border-radius: 0.5rem;
                        overflow: hidden;
                        border: 1px solid var(--p-content-border-color);

                        :deep(.p-image) {
                            width: 100%;
                            height: 100%;

                            img {
                                width: 100%;
                                height: 100%;
                                object-fit: cover;
                            }
                        }

                        .remove-btn {
                            position: absolute;
                            top: 0;
                            right: 0;
                            width: 1.5rem;
                            height: 1.5rem;
                            padding: 0;
                            z-index: 10;
                            background: rgb(var(--p-surface-900-rgb), 0.5);
                            color: white !important;

                            &:hover {
                                background: var(--p-red-500);
                            }
                        }
                    }
                }

                .quick-capture-divider {
                    margin: 0.25rem 0;
                }

                .quick-capture-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;

                    .footer-left {
                        display: flex;
                        gap: 0.25rem;
                    }

                    .footer-right {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;

                        .shortcut-tip {
                            font-size: 0.75rem;
                            color: var(--p-text-muted-color);

                            @media (width <= 640px) {
                                display: none;
                            }
                        }

                        .save-btn {
                            padding-left: 1.5rem;
                            padding-right: 1.5rem;
                        }
                    }
                }
            }
        }
    }

    .tools-section {
        @extend %stable-centered-column;

        margin-bottom: 2rem;

        :deep(.p-accordion) {
            width: 100%;
            background: var(--p-content-background);
            border: 1px solid var(--p-content-border-color);
            border-radius: 0.75rem;
            overflow: hidden;
        }

        :deep(.p-accordionpanel) {
            border: none;
            width: 100%;
        }

        :deep(.p-accordionheader) {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: transparent;
            padding: 1.25rem 1.5rem;
            transition: background-color 0.2s;
            font-weight: 600;
            border: none;
            cursor: pointer;

            &:hover {
                background: var(--p-content-hover-background);
            }
        }

        :deep(.p-accordioncontent) {
            background: transparent;
            width: 100%;
        }

        :deep(.p-accordioncontent-content) {
            padding: 1.5rem 1.25rem;
            width: 100%;
            box-sizing: border-box;
        }

        .bookmarklet-content {
            padding: 0;
            width: 100%;
            display: block;
            overflow: hidden;

            .bookmarklet-desc {
                font-size: 0.875rem;
                color: var(--p-text-muted-color);
                margin-bottom: 1.5rem;
                line-height: 1.6;
                padding-left: 2rem;
                max-width: 100%;
                display: block;
                overflow-wrap: break-word;

                @media (width <= 640px) {
                    padding-left: 0;
                }
            }

            .bookmarklet-actions {
                display: flex;
                align-items: center;
                gap: 1.5rem;
                flex-wrap: wrap;
                padding-left: 2rem;

                @media (width <= 640px) {
                    padding-left: 0;
                }

                .bookmarklet-link-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.5rem;
                    background: var(--p-primary-color);
                    color: var(--p-primary-contrast-color);
                    border-radius: 2rem;
                    text-decoration: none;
                    font-weight: 600;
                    cursor: move;
                    transition: transform 0.2s, opacity 0.2s;

                    &:hover {
                        transform: translateY(-2px);
                        opacity: 0.9;
                    }
                }
            }
        }
    }

    .snippets-container {
        .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5rem 0;
            gap: 1rem;

            .pi-spinner {
                font-size: 3rem;
                color: var(--p-primary-color);
            }

            .loading-text {
                color: var(--p-text-muted-color);
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
        }

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 5rem 0;
            text-align: center;
            background: var(--p-content-hover-background);
            border-radius: 0.75rem;
            border: 2px dashed var(--p-content-border-color);
            color: var(--p-text-muted-color);

            .empty-icon {
                font-size: 4.5rem;
                margin-bottom: 1rem;
                opacity: 0.2;
            }

            .empty-main-text {
                font-size: 1.25rem;
                font-weight: 500;
            }

            .empty-sub-text {
                font-size: 0.875rem;
                margin-top: 0.5rem;
            }
        }

        .snippets-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1.5rem;

            @media (width >= 768px) {
                grid-template-columns: repeat(2, 1fr);
            }

            @media (width >= 1280px) {
                grid-template-columns: repeat(3, 1fr);
            }

            .snippet-item-wrapper {
                display: flex;
                gap: 1rem;
                align-items: flex-start;

                .checkbox-wrapper {
                    padding-top: 1rem;
                }

                .snippet-card-item {
                    flex: 1;
                    transition: transform 0.2s ease;

                    &:hover {
                        transform: translateY(-0.25rem);
                    }
                }
            }
        }

        .pagination-wrapper {
            display: flex;
            justify-content: center;
            margin-top: 3rem;
            background: var(--p-content-background);
            padding: 1rem 1.5rem;
            border-radius: 9999px;
            box-shadow: var(--p-overlay-modal-shadow);
            border: 1px solid var(--p-content-border-color);
            position: sticky;
            bottom: 1rem;
            z-index: 10;
            max-width: max-content;
            margin-left: auto;
            margin-right: auto;

            .paginator-custom {
                background: transparent !important;
                border: none !important;
                padding: 0 !important;
            }
        }
    }
}

.aggregate-dialog {
    max-width: 48rem;
    width: 100%;

    .aggregating-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 0;
        gap: 1rem;

        .spinner {
            width: 4rem;
            height: 4rem;
        }

        .aggregating-text {
            font-size: 1.125rem;
            font-weight: 500;
            color: var(--p-primary-color);
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
    }

    .scaffold-preview-container {
        .scaffold-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;

            .scaffold-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.125rem;
                font-weight: 700;

                .pi-sparkles {
                    color: #eab308;
                }
            }
        }

        .scaffold-content-box {
            margin-bottom: 1.5rem;
            padding: 1.5rem;
            background: var(--p-surface-50);
            border: 1px solid var(--p-content-border-color);
            border-radius: 0.75rem;
            overflow-y: auto;
            max-height: 60vh;

            :deep(h1), :deep(h2), :deep(h3) {
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
                color: var(--p-primary-600);
            }

            :deep(ul), :deep(ol) {
                padding-left: 1.5rem;
                margin-bottom: 1rem;
            }

            :deep(li) {
                margin-bottom: 0.25rem;
            }
        }

        .dialog-actions-footer {
            display: flex;
            gap: 0.75rem;
            justify-content: flex-end;
            padding-top: 1rem;
            border-top: 1px solid var(--p-content-border-color);
        }
    }

    .aggregate-options {
        .mode-selector {
            margin-bottom: 1.5rem;
        }

        .options-form {
            display: flex;
            flex-direction: column;
            gap: 1.25rem;

            .option-field {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;

                .field-label {
                    font-weight: 700;
                    font-size: 0.875rem;
                    color: var(--p-text-color);
                }

                .field-input {
                    width: 100%;
                }

                &.inline-field {
                    flex-direction: row;
                    align-items: center;
                    gap: 0.75rem;

                    .inline-label {
                        font-weight: normal;
                        cursor: pointer;
                    }
                }
            }

            .option-row {
                display: grid;
                grid-template-columns: 1fr;
                gap: 1.25rem;

                @media (width >= 768px) {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        }
    }

    .aggregate-confirm {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1rem;

        .info-alert {
            display: flex;
            gap: 1rem;
            padding: 1.25rem;
            background: #eff6ff;
            color: #2563eb;
            border-radius: 0.75rem;
            border: 1px solid #dbeafe;

            .pi-info-circle {
                font-size: 1.5rem;
            }

            .alert-content {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;

                .alert-title {
                    font-weight: 700;
                }

                .alert-desc {
                    font-size: 0.875rem;
                    opacity: 0.9;
                }
            }
        }

        :global(.dark) .info-alert {
            background: rgb(30 58 138 / 0.2);
            color: #60a5fa;
            border-color: rgb(30 58 138 / 0.3);
        }

        .dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: 0.75rem;
        }
    }

    .expansion-tool {
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px dashed var(--p-content-border-color);

        .expansion-title {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--p-primary-color);
        }

        .expansion-fields {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;

            @media (width >= 768px) {
                grid-template-columns: repeat(2, 1fr);
            }

            .field-item {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;

                label {
                    font-size: 0.875rem;
                    font-weight: 600;
                }

                .field-input {
                    width: 100%;
                }

                &.full-width {
                    grid-column: 1 / -1;
                }
            }

            .expand-action-btn {
                width: 100%;
                margin-top: 0.5rem;
            }
        }

        .expansion-result-box {
            margin-top: 1.5rem;
            background: var(--p-content-background);
            border: 1px solid var(--p-primary-100);
            border-radius: 0.75rem;
            overflow: hidden;

            .result-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 1rem;
                background: var(--p-primary-50);
                font-size: 0.875rem;
                font-weight: 700;
                color: var(--p-primary-700);
                border-bottom: 1px solid var(--p-primary-100);
            }

            .result-content {
                padding: 1rem;
                max-height: 250px;
                overflow-y: auto;
                font-size: 0.9375rem;
                line-height: 1.6;

                :deep(p) {
                    margin-bottom: 0.75rem;
                }

                :deep(ul),
                :deep(ol) {
                    padding-left: 1.25rem;
                    margin-bottom: 0.75rem;
                }
            }
        }
    }
}

.edit-dialog {
    max-width: 40rem;
    width: 100%;

    :deep(.edit-textarea) {
        font-family: inherit;
    }

    .edit-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding: 1rem 0;

        .edit-field {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;

            .field-label {
                font-weight: 600;
                font-size: 0.875rem;
            }

            .field-input {
                width: 100%;
            }
        }
    }

    .edit-dialog-footer {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
        padding-top: 1rem;
    }
}

// Transitions
.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
    opacity: 0;
}

.snippet-list-move,
.snippet-list-enter-active,
.snippet-list-leave-active {
    transition: all 0.5s ease;
}

.snippet-list-enter-from,
.snippet-list-leave-to {
    opacity: 0;
    transform: scale(0.9) translateY(30px);
}

.snippet-list-leave-active {
    position: absolute;
}
</style>
