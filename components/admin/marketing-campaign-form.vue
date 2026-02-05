<template>
    <div class="flex flex-column gap-4 marketing-campaign-form">
        <div class="field">
            <label for="title" class="block font-bold mb-2">{{ $t('admin.marketing.form.title') }}</label>
            <InputText
                id="title"
                v-model="form.title"
                fluid
                :placeholder="$t('admin.marketing.form.placeholder_title')"
            />
        </div>

        <div class="field">
            <label for="content" class="block font-bold mb-2">{{ $t('admin.marketing.form.content') }}</label>
            <Textarea
                id="content"
                v-model="form.content"
                rows="10"
                fluid
                auto-resize
                :placeholder="$t('admin.marketing.form.placeholder_content')"
            />
        </div>

        <div class="field">
            <label class="block font-bold mb-2">{{ $t('admin.marketing.form.targets') }}</label>
            <div class="border-1 border-round flex flex-column gap-3 p-3 surface-border">
                <div class="align-items-center flex">
                    <RadioButton
                        v-model="targetType"
                        input-id="target-all"
                        name="target"
                        value="all"
                    />
                    <label for="target-all" class="cursor-pointer ml-2">{{ $t('admin.marketing.form.target_all') }}</label>
                </div>
                <div class="align-items-center flex">
                    <RadioButton
                        v-model="targetType"
                        input-id="target-criteria"
                        name="target"
                        value="criteria"
                    />
                    <label for="target-criteria" class="cursor-pointer ml-2">{{ $t('admin.marketing.form.target_criteria') }}</label>
                </div>

                <div v-show="targetType === 'criteria'" class="flex flex-column gap-3 pl-6">
                    <div class="field">
                        <label class="block font-medium mb-1 text-sm">{{ $t('admin.marketing.form.categories') }}</label>
                        <MultiSelect
                            v-model="form.targetCriteria.categoryIds"
                            :options="categories"
                            option-label="name"
                            option-value="id"
                            filter
                            fluid
                            display="chip"
                        />
                    </div>
                    <div class="field">
                        <label class="block font-medium mb-1 text-sm">{{ $t('admin.marketing.form.tags') }}</label>
                        <MultiSelect
                            v-model="form.targetCriteria.tagIds"
                            :options="tags"
                            option-label="name"
                            option-value="id"
                            filter
                            fluid
                            display="chip"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div class="flex gap-3 justify-content-end mt-4">
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
const props = defineProps<{
    campaignId?: string | null
}>()

const emit = defineEmits(['save', 'cancel'])

const { t } = useI18n()
const toast = useToast()

const categories = ref<any[]>([])
const tags = ref<any[]>([])
const saving = ref(false)
const targetType = ref('all')

const form = reactive({
    title: '',
    content: '',
    targetCriteria: {
        categoryIds: [] as string[],
        tagIds: [] as string[],
    },
})

const loadDependencies = async () => {
    try {
        const [catsRes, tagsRes] = await Promise.all([
            $fetch('/api/categories'),
            $fetch('/api/tags'),
        ])
        categories.value = (catsRes as any).data || []
        tags.value = (tagsRes as any).data || []
    } catch (e) {
        console.error('Failed to load dependencies:', e)
    }
}

const loadCampaign = async () => {
    if (!props.campaignId) return
    try {
        const res = await $fetch(`/api/admin/marketing/campaigns/${props.campaignId}`)
        const data = (res as any).data
        if (data) {
            form.title = data.title || ''
            form.content = data.content || ''
            form.targetCriteria = data.targetCriteria || { categoryIds: [], tagIds: [] }

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
.marketing-campaign-form {
    padding: 0.5rem;
}
</style>
