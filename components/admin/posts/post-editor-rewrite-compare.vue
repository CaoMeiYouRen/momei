<template>
    <Dialog
        :visible="visible"
        :header="$t('pages.admin.posts.ai.rewrite_compare_title')"
        :style="{width: '48rem'}"
        :modal="true"
        :closable="false"
        :draggable="false"
        class="rewrite-compare"
        @hide="emit('cancel')"
    >
        <div class="rewrite-compare__body">
            <div class="rewrite-compare__badge">
                <Tag :value="styleLabel" severity="info" />
            </div>
            <div class="rewrite-compare__columns">
                <div class="rewrite-compare__col">
                    <div class="rewrite-compare__col-header">
                        <i class="pi pi-file" />
                        {{ $t('pages.admin.posts.ai.rewrite_original') }}
                    </div>
                    <div class="rewrite-compare__content">
                        <pre>{{ data?.original }}</pre>
                    </div>
                </div>
                <div class="rewrite-compare__col rewrite-compare__col--new">
                    <div class="rewrite-compare__col-header">
                        <i class="pi pi-pencil" />
                        {{ $t('pages.admin.posts.ai.rewrite_result') }}
                    </div>
                    <div class="rewrite-compare__content">
                        <pre>{{ data?.rewritten }}</pre>
                    </div>
                </div>
            </div>
        </div>
        <template #footer>
            <div class="rewrite-compare__footer">
                <Button
                    :label="$t('pages.admin.posts.ai.rewrite_keep_original')"
                    icon="pi pi-times"
                    severity="secondary"
                    @click="emit('cancel')"
                />
                <Button
                    :label="$t('pages.admin.posts.ai.rewrite_apply')"
                    icon="pi pi-check"
                    severity="success"
                    @click="emit('confirm')"
                />
            </div>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import type { RewriteCompareData } from '@/types/ai'

const { t } = useI18n()

const props = defineProps<{
    visible: boolean
    data: RewriteCompareData | null
}>()

const emit = defineEmits<{
    confirm: []
    cancel: []
}>()

const styleLabels: Record<string, string> = {
    casual: t('pages.admin.posts.ai.rewrite_style_casual'),
    formal: t('pages.admin.posts.ai.rewrite_style_formal'),
    academic: t('pages.admin.posts.ai.rewrite_style_academic'),
    technical: t('pages.admin.posts.ai.rewrite_style_technical'),
    creative: t('pages.admin.posts.ai.rewrite_style_creative'),
    concise: t('pages.admin.posts.ai.rewrite_style_concise'),
}

const styleLabel = computed(() => {
    if (!props.data) {
        return ''
    }
    return styleLabels[props.data.style] || props.data.style
})
</script>

<style lang="scss" scoped>
.rewrite-compare {
    &__body {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    &__badge {
        display: flex;
        justify-content: center;
    }

    &__columns {
        display: flex;
        gap: 1rem;

        @media (width <= 640px) {
            flex-direction: column;
        }
    }

    &__col {
        flex: 1;
        min-width: 0;
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius-md);
        overflow: hidden;

        &--new {
            border-color: var(--p-green-400);
        }
    }

    &__col-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.8125rem;
        font-weight: 600;
        background: var(--p-surface-50);
        border-bottom: 1px solid var(--p-surface-border);
        color: var(--p-text-muted-color);
    }

    &__content {
        padding: 0.75rem;
        max-height: 300px;
        overflow-y: auto;

        pre {
            margin: 0;
            font-size: 0.875rem;
            line-height: 1.6;
                        white-space: pre-wrap;
                        overflow-wrap: anywhere;
            color: var(--p-text-color);
            font-family: inherit;
        }
    }

    &__footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
}

:global(.dark) {
    .rewrite-compare {
        &__col-header {
            background: var(--p-surface-800);
        }
    }
}
</style>
