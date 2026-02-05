<template>
    <div class="marketing-campaign-form">
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

        <div class="marketing-campaign-form__actions">
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
const targetType = ref('all')

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
    title: '',
    content: '',
    targetCriteria: {
        categoryIds: [] as string[],
        tagIds: [] as string[],
    },
})

const loadDependencies = async () => {
    loadingDependencies.value = true
    try {
        const [catsRes, tagsRes] = await Promise.all([
            $fetch<ApiResponse<PaginatedData<Category>>>('/api/categories', { query: { limit: 500 } }),
            $fetch<ApiResponse<PaginatedData<Tag>>>('/api/tags', { query: { limit: 500 } }),
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
            form.title = data.title || ''
            form.content = data.content || ''
            form.targetCriteria = {
                categoryIds: data.targetCriteria?.categoryIds || [],
                tagIds: data.targetCriteria?.tagIds || [],
            }

            if (form.targetCriteria.categoryIds?.length || form.targetCriteria.tagIds?.length) {
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
        const payload = {
            title: form.title,
            content: form.content,
            targetCriteria: targetType.value === 'all' ? {} : form.targetCriteria,
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
        gap: $spacing-md;
        margin-top: $spacing-lg;
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
