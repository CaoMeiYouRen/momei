<template>
    <Dialog
        :visible="visible"
        :header="$t('pages.admin.ai.tasks')"
        modal
        class="max-w-50rem w-full"
        @update:visible="$emit('update:visible', $event)"
    >
        <div v-if="task" class="flex flex-column gap-4">
            <div class="detail-info grid">
                <div class="col-12 md:col-6">
                    <div class="detail-item">
                        <span class="label">{{ $t('pages.admin.ai.type') }}:</span>
                        <span class="value">{{ $t(`pages.admin.ai.types.${task.type}`) }}</span>
                    </div>
                    <div class="detail-item mt-2">
                        <span class="label">{{ $t('pages.admin.ai.status') }}:</span>
                        <Tag
                            :value="$t(`pages.admin.ai.statuses.${task.status}`)"
                            :severity="getStatusSeverity(task.status)"
                        />
                    </div>
                </div>
                <div class="col-12 md:col-6">
                    <div class="detail-item">
                        <span class="label">{{ $t('pages.admin.ai.provider') }}:</span>
                        <span class="value">{{ task.provider }} / {{ task.model }}</span>
                    </div>
                    <div class="detail-item mt-2">
                        <span class="label">{{ $t('common.author') }}:</span>
                        <div class="value">
                            <strong>{{ task.user_name || 'Unknown' }}</strong>
                            <span>{{ task.user_email }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="task.error" class="error-section">
                <Message
                    severity="error"
                    :closable="false"
                    class="m-0"
                >
                    <strong>{{ $t('pages.admin.ai.error') }}:</strong><br>
                    <div class="mt-1 text-sm">
                        {{ task.error }}
                    </div>
                </Message>
            </div>

            <div
                v-if="task.type === 'image_generation' && getTaskImages(task).length > 0"
                class="image-preview-section"
            >
                <h4 class="font-bold m-0 mb-3 text-lg">
                    <i class="mr-2 pi pi-images" />{{ $t('pages.admin.ai.images') }}
                </h4>
                <div class="bg-emphasis border-round flex flex-wrap gap-3 p-3">
                    <Image
                        v-for="(img, idx) in getTaskImages(task)"
                        :key="idx"
                        :src="img"
                        alt="AI Generated"
                        width="240"
                        preview
                        class="border-round hover:scale-105 overflow-hidden shadow-2 transition-transform"
                    />
                </div>
            </div>

            <div class="data-section grid">
                <div class="col-12 lg:col-6">
                    <h4 class="align-items-center flex font-bold m-0 mb-2">
                        <i class="mr-2 pi pi-code" />{{ $t('pages.admin.ai.prompt') }}
                    </h4>
                    <div class="json-container">
                        <pre>{{ formatJson(task.payload) }}</pre>
                    </div>
                </div>

                <div v-if="task.result" class="col-12 lg:col-6">
                    <h4 class="align-items-center flex font-bold m-0 mb-2">
                        <i class="mr-2 pi pi-database" />{{ $t('pages.admin.ai.result') }}
                    </h4>
                    <div class="json-container">
                        <pre>{{ formatJson(task.result) }}</pre>
                    </div>
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
defineProps<{
    visible: boolean
    task: any
}>()

defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()

const getStatusSeverity = (status: string) => {
    switch (status) {
        case 'completed': return 'success'
        case 'processing': return 'info'
        case 'failed': return 'danger'
        default: return 'secondary'
    }
}

const formatJson = (data: any) => {
    if (!data) return ''
    try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data
        return JSON.stringify(parsed, null, 2)
    } catch (e) {
        return data.toString()
    }
}

const getTaskImages = (task: any) => {
    if (!task || task.type !== 'image_generation' || !task.result) return []
    try {
        const res = typeof task.result === 'string' ? JSON.parse(task.result) : task.result
        if (res.images && Array.isArray(res.images)) {
            return res.images.map((img: any) => img.url).filter(Boolean)
        }
        return []
    } catch (e) {
        return []
    }
}
</script>

<style lang="scss" scoped>
.detail-item {
    .label {
        font-weight: bold;
        margin-right: 0.5rem;
        color: var(--text-color-secondary);
    }
}

.json-container {
    background-color: var(--content-background);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1rem;
    max-height: 300px;
    overflow-y: auto;

    pre {
        margin: 0;
        font-family: monospace;
        font-size: 0.875rem;
        white-space: pre-wrap;
        word-break: break-all;
    }
}

.error-section {
    :deep(.p-message) {
        border-width: 0 0 0 6px;
    }
}
</style>
