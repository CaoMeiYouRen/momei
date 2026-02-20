<template>
    <div class="marketing-campaign-form">
        <div class="marketing-campaign-form__field">
            <label for="type" class="marketing-campaign-form__label">{{ $t('pages.admin.marketing.form.type') }}</label>
            <Select
                id="type"
                v-model="form.type"
                :options="campaignTypes"
                option-label="label"
                option-value="value"
                fluid
                :placeholder="$t('pages.admin.marketing.form.type_placeholder')"
            />
        </div>

        <div class="marketing-campaign-form__field">
            <label for="title" class="marketing-campaign-form__label">{{ $t('pages.admin.marketing.form.title') }}</label>
            <InputText
                id="title"
                v-model="form.title"
                fluid
                :placeholder="$t('pages.admin.marketing.form.placeholder_title')"
            />
        </div>

        <div class="marketing-campaign-form__field">
            <label for="content" class="marketing-campaign-form__label">{{ $t('pages.admin.marketing.form.content') }}</label>
            <div class="marketing-campaign-form__editor">
                <ClientOnly>
                    <mavon-editor
                        v-model="form.content"
                        :placeholder="$t('pages.admin.marketing.form.placeholder_content')"
                        language="zh-CN"
                        :toolbars="toolbars"
                        class="marketing-campaign-form__mavon"
                    />
                </ClientOnly>
            </div>
        </div>

        <div class="marketing-campaign-form__field">
            <label class="marketing-campaign-form__label">{{ $t('pages.admin.marketing.form.targets') }}</label>
            <div class="marketing-campaign-form__targets">
                <div class="marketing-campaign-form__target-option">
                    <RadioButton
                        v-model="targetType"
                        input-id="target-all"
                        name="target"
                        value="all"
                    />
                    <label for="target-all" class="marketing-campaign-form__target-label">{{ $t('pages.admin.marketing.form.target_all') }}</label>
                </div>
                <div class="marketing-campaign-form__target-option">
                    <RadioButton
                        v-model="targetType"
                        input-id="target-criteria"
                        name="target"
                        value="criteria"
                    />
                    <label for="target-criteria" class="marketing-campaign-form__target-label">{{ $t('pages.admin.marketing.form.target_criteria') }}</label>
                </div>

                <div v-if="targetType === 'criteria'" class="marketing-campaign-form__criteria">
                    <div class="marketing-campaign-form__field">
                        <label class="marketing-campaign-form__label--sub">{{ $t('pages.admin.marketing.form.categories') }}</label>
                        <MultiSelect
                            v-model="form.targetCriteria.categoryIds"
                            :options="categories"
                            option-label="name"
                            option-value="id"
                            filter
                            fluid
                            display="chip"
                            append-to="body"
                            :loading="loadingDependencies"
                            :placeholder="$t('common.category')"
                        />
                    </div>
                    <div class="marketing-campaign-form__field">
                        <label class="marketing-campaign-form__label--sub">{{ $t('pages.admin.marketing.form.tags') }}</label>
                        <MultiSelect
                            v-model="form.targetCriteria.tagIds"
                            :options="tags"
                            option-label="name"
                            option-value="id"
                            filter
                            fluid
                            display="chip"
                            append-to="body"
                            :loading="loadingDependencies"
                            :placeholder="$t('common.tags')"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="marketing-campaign-form__field">
            <label for="scheduledAt" class="marketing-campaign-form__label">{{ $t('pages.admin.marketing.form.scheduled_at') }}</label>
            <DatePicker
                id="scheduledAt"
                v-model="form.scheduledAt"
                show-time
                hour-format="24"
                fluid
                :placeholder="$t('pages.admin.marketing.form.scheduled_at_placeholder')"
            />
            <small class="marketing-campaign-form__help">{{ $t('pages.admin.marketing.form.scheduled_at_help') }}</small>
        </div>

        <div class="marketing-campaign-form__actions">
            <Button
                :label="$t('pages.admin.marketing.form.send_test')"
                icon="pi pi-send"
                severity="info"
                variant="outlined"
                :loading="sendingTest"
                @click="handleSendTest"
            />
            <div class="marketing-campaign-form__spacer" />
            <Button
                :label="$t('common.cancel')"
                variant="outlined"
                severity="secondary"
                @click="$emit('cancel')"
            />
            <Button
                :label="$t('common.save')"
                :loading="saving"
                @click="handleSave"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Category } from '@/types/category'
import type { Tag } from '@/types/tag'
import type { ApiResponse } from '@/types/api'
import type { MarketingCampaign, PaginatedData } from '@/types/marketing'
import { MarketingCampaignType } from '@/utils/shared/notification'

const props = defineProps<{
    campaignId?: string | null
}>()

const emit = defineEmits(['save', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()

const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const loadingDependencies = ref(false)
const saving = ref(false)
const sendingTest = ref(false)
const targetType = ref('all')

const campaignTypes = computed(() => [
    { label: t('pages.admin.marketing.type.update'), value: MarketingCampaignType.UPDATE },
    { label: t('pages.admin.marketing.type.feature'), value: MarketingCampaignType.FEATURE },
    { label: t('pages.admin.marketing.type.promotion'), value: MarketingCampaignType.PROMOTION },
    { label: t('pages.admin.marketing.type.blog_post'), value: MarketingCampaignType.BLOG_POST },
    { label: t('pages.admin.marketing.type.maintenance'), value: MarketingCampaignType.MAINTENANCE },
    { label: t('pages.admin.marketing.type.service'), value: MarketingCampaignType.SERVICE },
])

const toolbars = {
    bold: true,
    italic: true,
    header: true,
    underline: true,
    strikethrough: true,
    mark: true,
    superscript: true,
    subscript: true,
    quote: true,
    ol: true,
    ul: true,
    link: true,
    imagelink: true,
    code: true,
    table: true,
    fullscreen: true,
    readmodel: true,
    htmlcode: true,
    help: true,
    undo: true,
    redo: true,
    trash: true,
    save: true,
    navigation: true,
    alignleft: true,
    aligncenter: true,
    alignright: true,
    subfield: true,
    preview: true,
}

const form = reactive({
    type: MarketingCampaignType.FEATURE,
    title: '',
    content: '',
    targetCriteria: {
        categoryIds: [] as string[],
        tagIds: [] as string[],
    },
    scheduledAt: null as Date | null,
})

const loadDependencies = async () => {
    loadingDependencies.value = true
    try {
        const [catsRes, tagsRes] = await Promise.all([
            $fetch<ApiResponse<PaginatedData<Category>>>('/api/categories', {
                query: { limit: 500, aggregate: true, language: locale.value },
            }),
            $fetch<ApiResponse<PaginatedData<Tag>>>('/api/tags', {
                query: { limit: 500, aggregate: true, language: locale.value },
            }),
        ])
        categories.value = catsRes.data.items || []
        tags.value = tagsRes.data.items || []
    } catch (e) {
        console.error('Failed to load dependencies:', e)
    } finally {
        loadingDependencies.value = false
    }
}

const loadCampaign = async () => {
    if (!props.campaignId) return
    try {
        const res = await $fetch<ApiResponse<MarketingCampaign>>(`/api/admin/marketing/campaigns/${props.campaignId}`)
        const data = res.data
        if (data) {
            form.type = data.type || MarketingCampaignType.FEATURE
            form.title = data.title || ''
            form.content = data.content || ''
            form.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null

            const serverCategoryIds = data.targetCriteria?.categoryIds || []
            const serverTagIds = data.targetCriteria?.tagIds || []

            // 对于回显逻辑，由于后端可能存了多个 ID，我们需要反向还原到当前语言的聚合 ID
            form.targetCriteria.categoryIds = categories.value
                .filter((cat) => {
                    const clusterIds = cat.translations?.map((t) => t.id) || [cat.id]
                    return clusterIds.some((id) => serverCategoryIds.includes(id))
                })
                .map((cat) => cat.id)

            form.targetCriteria.tagIds = tags.value
                .filter((tag) => {
                    const clusterIds = tag.translations?.map((t) => t.id) || [tag.id]
                    return clusterIds.some((id) => serverTagIds.includes(id))
                })
                .map((tag) => tag.id)

            if (form.targetCriteria.categoryIds.length || form.targetCriteria.tagIds.length) {
                targetType.value = 'criteria'
            } else {
                targetType.value = 'all'
            }
        }
    } catch (e) {
        console.error('Failed to load campaign:', e)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('common.error_loading'),
            life: 3000,
        })
    }
}

onMounted(async () => {
    await loadDependencies()
    if (props.campaignId) {
        await loadCampaign()
    }
})

const handleSendTest = async () => {
    if (!form.title || !form.content) {
        toast.add({
            severity: 'warn',
            summary: t('common.warn'),
            detail: t('common.validation_error'),
            life: 3000,
        })
        return
    }

    sendingTest.value = true
    try {
        await $fetch('/api/admin/marketing/campaigns/test', {
            method: 'POST',
            body: {
                type: form.type,
                title: form.title,
                content: form.content,
                targetCriteria: {},
            },
        })

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('pages.admin.marketing.form.send_test_success'),
            life: 3000,
        })
    } catch (e) {
        console.error('Failed to send test campaign:', e)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('common.unexpected_error'),
            life: 3000,
        })
    } finally {
        sendingTest.value = false
    }
}

const handleSave = async () => {
    if (!form.title || !form.content) {
        toast.add({
            severity: 'warn',
            summary: t('common.warn'),
            detail: t('common.validation_error'),
            life: 3000,
        })
        return
    }

    saving.value = true
    try {
        // 展开目标条件中的 ID 到所有语言版本
        const finalCategoryIds = new Set<string>()
        categories.value.forEach((cat) => {
            if (form.targetCriteria.categoryIds.includes(cat.id)) {
                cat.translations?.forEach((t) => finalCategoryIds.add(t.id))
                finalCategoryIds.add(cat.id)
            }
        })

        const finalTagIds = new Set<string>()
        tags.value.forEach((tag) => {
            if (form.targetCriteria.tagIds.includes(tag.id)) {
                tag.translations?.forEach((t) => finalTagIds.add(t.id))
                finalTagIds.add(tag.id)
            }
        })

        const payload = {
            type: form.type,
            title: form.title,
            content: form.content,
            targetCriteria: targetType.value === 'all'
                ? {}
                : {
                        categoryIds: Array.from(finalCategoryIds),
                        tagIds: Array.from(finalTagIds),
                    },
            scheduledAt: form.scheduledAt ? form.scheduledAt.toISOString() : null,
        }

        if (props.campaignId) {
            await $fetch(`/api/admin/marketing/campaigns/${props.campaignId}`, {
                method: 'PUT' as any,
                body: payload,
            })
        } else {
            await $fetch('/api/admin/marketing/campaigns', {
                method: 'POST',
                body: payload,
            })
        }

        toast.add({
            severity: 'success',
            summary: t('common.success'),
            detail: t('common.save_success'),
            life: 3000,
        })
        emit('save')
    } catch (e) {
        console.error('Failed to save campaign:', e)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('common.save_failed'),
            life: 3000,
        })
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
@use "@/styles/variables" as *;

.marketing-campaign-form {
    display: flex;
    flex-direction: column;
    gap: $spacing-lg;
    padding: $spacing-xs;

    &__field {
        display: flex;
        flex-direction: column;
        gap: $spacing-xs;
    }

    &__label {
        display: block;
        font-weight: 600;
        color: var(--p-text-color);
        margin-bottom: $spacing-xs;

        &--sub {
            display: block;
            font-weight: 500;
            font-size: 0.875rem;
            color: var(--p-text-color-secondary);
            margin-bottom: $spacing-xs;
        }
    }

    &__targets {
        border: 1px solid var(--p-surface-border);
        border-radius: $border-radius-md;
        padding: $spacing-md;
        display: flex;
        flex-direction: column;
        gap: $spacing-md;
    }

    &__target-option {
        display: flex;
        align-items: center;
        gap: $spacing-sm;
    }

    &__target-label {
        cursor: pointer;
        color: var(--p-text-color);
    }

    &__criteria {
        padding-left: $spacing-xl;
        display: flex;
        flex-direction: column;
        gap: $spacing-md;
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: $spacing-md;
        margin-top: $spacing-lg;
    }

    &__spacer {
        flex-grow: 1;
    }

    &__editor {
        border: 1px solid var(--p-content-border-color);
        border-radius: var(--p-content-border-radius);
        overflow: hidden;
        min-height: 400px;
    }

    &__mavon {
        width: 100%;
        height: 100%;
        min-height: 400px;
        border: none !important;
        z-index: 100;

        &.fullscreen {
            z-index: 2000 !important;
        }

        :deep(.v-note-wrapper) {
            border: none;
            box-shadow: none;
        }
    }
}
</style>
