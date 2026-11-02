<template>
    <CaomeiDialog
        :close-on-overlay="false"
        :open="visible"
        :title="$t('pages.admin.ai.tasks')"
        modal
        class="max-w-50rem w-full"
        @update:open="$emit('update:visible', $event)"
    >
        <div v-if="loading" class="task-details-dialog__state">
            <ProgressSpinner stroke-width="4" />
        </div>

        <Message
            v-else-if="errorMessage"
            severity="error"
            :closable="false"
        >
            {{ errorMessage }}
        </Message>

        <AdminAiTaskDetailContent
            v-else-if="task"
            :task="task"
            :cost-display="costDisplay"
        />
    </CaomeiDialog>
</template>

<script setup lang="ts">
import type { AIAdminTaskDetailItem, AICostDisplay } from '@/types/ai'

defineProps<{
    visible: boolean
    loading?: boolean
    errorMessage?: string | null
    task: AIAdminTaskDetailItem | null
    costDisplay?: AICostDisplay | null
}>()

defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()
</script>

<style lang="scss" scoped>
.task-details-dialog {
    &__state {
        display: flex;
        justify-content: center;
        padding: 3rem 0;
    }
}
</style>
