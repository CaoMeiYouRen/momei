<template>
    <div class="admin-page-container ai-task-detail-page">
        <AdminPageHeader :title="$t('pages.admin.ai.task_detail.title')">
            <template #actions>
                <Button
                    icon="pi pi-arrow-left"
                    severity="secondary"
                    variant="outlined"
                    :label="$t('pages.admin.ai.task_detail.back_to_previous')"
                    @click="goBack"
                />
            </template>
        </AdminPageHeader>

        <div class="ai-task-detail-page__content">
            <div v-if="pending" class="ai-task-detail-page__state">
                <ProgressSpinner stroke-width="4" />
            </div>

            <Message
                v-else-if="errorMessage"
                severity="error"
                :closable="false"
            >
                {{ errorMessage }}
            </Message>

            <Card v-else-if="task">
                <template #content>
                    <AdminAiTaskDetailContent
                        :task="task"
                        :cost-display="costDisplay"
                    />
                </template>
            </Card>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ApiResponse } from '@/types/api'
import type { AITaskDetailResponse } from '@/types/ai'

definePageMeta({
    middleware: 'admin',
})

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { t } = useI18n()

const taskId = computed(() => String(route.params.id || ''))

const { data, pending, error } = await useFetch<ApiResponse<AITaskDetailResponse>>(() => `/api/ai/tasks/${taskId.value}`)

const task = computed(() => data.value?.data.item || null)
const costDisplay = computed(() => data.value?.data.costDisplay || null)
const errorMessage = computed(() => {
    const candidate = error.value as {
        data?: { message?: string, statusMessage?: string }
        statusMessage?: string
        message?: string
    } | null

    return candidate?.data?.message
        || candidate?.data?.statusMessage
        || candidate?.statusMessage
        || candidate?.message
        || null
})

useHead(() => ({
    title: t('pages.admin.ai.task_detail.page_title', { id: taskId.value }),
}))

function goBack() {
    if (window.history.length > 1) {
        router.back()
        return
    }

    void navigateTo(localePath('/admin/ai'))
}
</script>

<style lang="scss" scoped>
.ai-task-detail-page {
    &__content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    &__state {
        display: flex;
        justify-content: center;
        padding: 3rem 0;
    }
}
</style>
