<template>
    <CaomeiDialog
        :open="visible"
        :title="$t('pages.admin.posts.ai.rewrite_compare_title')"
        :style="{width: '48rem'}"
        :closable="false"
        :close-on-overlay="false"
        class="rewrite-compare"
        @update:open="emit('cancel')"
    >
        <div class="rewrite-compare__body">
            <div class="rewrite-compare__badge">
                <CaomeiTag tone="primary">
                    {{ styleLabel }}
                </CaomeiTag>
            </div>
            <div class="rewrite-compare__columns">
                <div class="rewrite-compare__col">
                    <div class="rewrite-compare__col-header">
                        <FileText :size="16" />
                        {{ $t('pages.admin.posts.ai.rewrite_original') }}
                    </div>
                    <div class="rewrite-compare__content">
                        <pre>{{ data?.original }}</pre>
                    </div>
                </div>
                <div class="rewrite-compare__col rewrite-compare__col--new">
                    <div class="rewrite-compare__col-header">
                        <Pencil :size="16" />
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
                <CaomeiButton
                    variant="secondary"
                    tone="neutral"
                    @click="emit('cancel')"
                >
                    <template #icon>
                        <X :size="16" />
                    </template>
                    {{ $t('pages.admin.posts.ai.rewrite_keep_original') }}
                </CaomeiButton>
                <CaomeiButton
                    tone="success"
                    @click="emit('confirm')"
                >
                    <template #icon>
                        <Check :size="16" />
                    </template>
                    {{ $t('pages.admin.posts.ai.rewrite_apply') }}
                </CaomeiButton>
            </div>
        </template>
    </CaomeiDialog>
</template>

<script setup lang="ts">
import { Check, FileText, Pencil, X } from '@lucide/vue'
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
        overflow: hidden;

        &--new {
            border-color: var(--m-green-400);
        }
    }

    &__col-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.8125rem;
        font-weight: 600;
        background: var(--m-surface-50);
        color: var(--caomei-color-text-muted);
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
            color: var(--caomei-color-text);
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
            background: var(--m-surface-800);
        }
    }
}
</style>
