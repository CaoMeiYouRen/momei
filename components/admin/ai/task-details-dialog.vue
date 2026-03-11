<template>
    <Dialog
        :visible="visible"
        :header="$t('pages.admin.ai.tasks')"
        modal
        class="max-w-50rem w-full"
        @update:visible="$emit('update:visible', $event)"
    >
        <AdminAiTaskDetailContent
            v-if="task"
            :task="task"
            :cost-display="costDisplay"
        />
    </Dialog>
</template>

<script setup lang="ts">
import type { AIAdminTaskListItem, AICostDisplay } from '@/types/ai'

defineProps<{
    visible: boolean
    task: AIAdminTaskListItem | null
    costDisplay?: AICostDisplay | null
}>()

defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()
</script>
