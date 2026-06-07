<template>
    <Dialog
        :visible="visible"
        :header="$t('pages.admin.posts.audit.dialog_title')"
        :style="{width: '540px'}"
        :modal="true"
        @update:visible="$emit('close')"
    >
        <template v-if="result">
            <div v-if="aiPending" class="audit-pending">
                <Tag
                    icon="pi pi-spin pi-spinner"
                    severity="info"
                    :value="$t('pages.admin.posts.audit.ai_pending')"
                />
                <p class="audit-pending-text">
                    {{ $t('pages.admin.posts.audit.ai_pending_desc') }}
                </p>
            </div>

            <!-- 总分 -->
            <div class="audit-overall">
                <div class="audit-score">
                    {{ result.score }}
                </div>
                <Tag
                    :value="result.tier === 'good'
                        ? $t('pages.admin.posts.audit.tier_good')
                        : $t('pages.admin.posts.audit.tier_needs_improvement')"
                    :severity="result.tier === 'good' ? 'success' : 'warn'"
                />
            </div>

            <ProgressBar :value="result.score" class="audit-overall-bar" />

            <!-- 元数据完整度 -->
            <div class="audit-section">
                <h3 class="audit-section-title">
                    {{ $t('pages.admin.posts.audit.meta_completeness') }}
                </h3>
                <div
                    v-for="key in metaFactors"
                    :key="key"
                    class="audit-detail-row"
                >
                    <div class="audit-detail-header">
                        <span class="audit-detail-label">{{ $t(`pages.admin.posts.audit.factors.${key}`) }}</span>
                        <span class="audit-detail-score">{{ result.metaCompleteness.details[key].score }}/20</span>
                    </div>
                    <ProgressBar :value="result.metaCompleteness.details[key].score * 5" class="audit-detail-bar" />
                    <span class="audit-detail-msg">{{ $t((result.metaCompleteness.details[key].key as any), result.metaCompleteness.details[key].params as any) }}</span>
                </div>
            </div>

            <!-- 可读性 -->
            <div class="audit-section">
                <h3 class="audit-section-title">
                    {{ $t('pages.admin.posts.audit.readability') }}
                </h3>
                <div class="audit-detail-header">
                    <span class="audit-detail-label">{{ $t('pages.admin.posts.audit.readability_score') }}</span>
                    <span class="audit-detail-score">{{ result.readability.score }}/100</span>
                </div>
                <ProgressBar :value="result.readability.score" class="audit-detail-bar" />
            </div>

            <!-- AI 建议 -->
            <div v-if="result.readability.suggestions.length" class="audit-section">
                <h3 class="audit-section-title">
                    {{ $t('pages.admin.posts.audit.suggestions') }}
                </h3>
                <ul class="audit-suggestions">
                    <li v-for="(s, i) in result.readability.suggestions" :key="i">
                        {{ s }}
                    </li>
                </ul>
            </div>

            <div v-else-if="aiPending" class="audit-section">
                <h3 class="audit-section-title">
                    {{ $t('pages.admin.posts.audit.suggestions') }}
                </h3>
                <p class="audit-detail-msg">
                    {{ $t('pages.admin.posts.audit.suggestions_pending') }}
                </p>
            </div>

            <!-- 缓存时间 -->
            <p class="audit-cached-at">
                {{ $t('pages.admin.posts.audit.cached_at') }}:
                {{ formatDate(result.cachedAt) }}
            </p>
        </template>

        <template #footer>
            <Button
                :label="$t('pages.admin.posts.audit.re_audit')"
                icon="pi pi-refresh"
                severity="secondary"
                :loading="reAuditing"
                @click="$emit('re-audit')"
            />
            <Button
                :label="$t('common.close')"
                icon="pi pi-times"
                text
                @click="$emit('close')"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import type { PostAuditResult } from '@/types/post'

defineProps<{
    visible: boolean
    result: PostAuditResult | null
    aiPending: boolean
    reAuditing: boolean
}>()

defineEmits<{
    close: []
    're-audit': []
}>()

const { formatDate } = useI18nDate()

const metaFactors = ['title', 'summary', 'coverImage', 'tags', 'category'] as const

</script>

<style scoped>
.audit-overall {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 0.5rem;
}

.audit-pending {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.audit-pending-text {
    margin: 0;
    font-size: 0.8rem;
    color: var(--p-text-muted-color);
}

.audit-score {
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
}

.audit-overall-bar {
    margin-bottom: 1.5rem;
}

.audit-section {
    margin-bottom: 1.25rem;
}

.audit-section-title {
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.audit-detail-row {
    margin-bottom: 0.75rem;
}

.audit-detail-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.2rem;
}

.audit-detail-label {
    font-size: 0.85rem;
    color: var(--p-text-color);
}

.audit-detail-score {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--p-text-muted-color);
}

.audit-detail-bar {
    margin-bottom: 0.2rem;
}

.audit-detail-msg {
    font-size: 0.8rem;
    color: var(--p-text-muted-color);
}

.audit-suggestions {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    line-height: 1.6;
}

.audit-cached-at {
    font-size: 0.75rem;
    color: var(--p-text-muted-color);
    margin-top: 1rem;
}
</style>
