<template>
    <CaomeiDialog
        :close-on-overlay="false"
        :open="visible"
        :title="$t('pages.admin.posts.audit.dialog_title')"
        :style="{width: '540px'}"
        @update:open="emit('close')"
    >
        <template v-if="result">
            <div v-if="aiPending" class="audit-pending">
                <CaomeiTag tone="primary">
                    <template #icon>
                        <LoaderCircle :size="12" class="audit-spin" />
                    </template>
                    {{ $t('pages.admin.posts.audit.ai_pending') }}
                </CaomeiTag>
                <p class="audit-pending-text">
                    {{ $t('pages.admin.posts.audit.ai_pending_desc') }}
                </p>
            </div>

            <!-- 总分 -->
            <div class="audit-overall">
                <div class="audit-score">
                    {{ result.score }}
                </div>
                <CaomeiTag :tone="result.tier === 'good' ? 'success' : 'warning'">
                    {{ result.tier === 'good'
                        ? $t('pages.admin.posts.audit.tier_good')
                        : $t('pages.admin.posts.audit.tier_needs_improvement') }}
                </CaomeiTag>
            </div>

            <CaomeiProgressBar :value="result.score" class="audit-overall-bar" />

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
                    <CaomeiProgressBar :value="result.metaCompleteness.details[key].score * 5" class="audit-detail-bar" />
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
                <CaomeiProgressBar :value="result.readability.score" class="audit-detail-bar" />
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
            <CaomeiButton
                variant="secondary"
                :loading="reAuditing"
                @click="emit('re-audit')"
            >
                <template #icon>
                    <RefreshCw :size="16" />
                </template>
                {{ $t('pages.admin.posts.audit.re_audit') }}
            </CaomeiButton>
            <CaomeiButton
                variant="ghost"
                @click="emit('close')"
            >
                <template #icon>
                    <X :size="16" />
                </template>
                {{ $t('common.close') }}
            </CaomeiButton>
        </template>
    </CaomeiDialog>
</template>

<script setup lang="ts">
import { LoaderCircle, RefreshCw, X } from '@lucide/vue'
import type { PostAuditResult } from '@/types/post'

/**
 * 「文章审计详情浮层」的实现（原 V2 过渡壳，2026-11-07 起为唯一实现）。
 *
 * 历史：曾与 V1 并存（消费处静态择库），编辑器子批迁移后 V1 删除；本批同时把 `ProgressBar`
 * 迁入 caomei-ui。
 *
 * 与旧 V1 的差异（均为有意，见迁移方案 §6.2）：
 * - `Button` → `CaomeiButton`：页脚两个按钮在 V1 走 `:label` + `icon`（可见文案），
 *   迁移后可见文案落**默认插槽**、图标走 lucide `#icon`（caomei `label` 只映射可访问名）；
 *   `severity="secondary"` → `variant="secondary"`、`text` → `variant="ghost"`；
 * - `Tag` 的 `severity="info"` → `tone="primary"`、`success` / `warn` → `success` / `warning`；
 * - 加载态图标由 `pi pi-spin pi-spinner` 换成 lucide `LoaderCircle` + 本组件内旋转动画；
 * - `Dialog` 于第六十九阶段浮层批次迁移；`ProgressBar` 已随 2026-11-07 编辑器子批迁入 caomei-ui。
 */
defineProps<{
    visible: boolean
    result: PostAuditResult | null
    aiPending: boolean
    reAuditing: boolean
}>()

const emit = defineEmits<{
    close: []
    're-audit': []
}>()

const { formatDate } = useI18nDate()

const metaFactors = ['title', 'summary', 'coverImage', 'tags', 'category'] as const
</script>

<style lang="scss" scoped src="./post-audit-dialog.scss"></style>

<style lang="scss" scoped>
/* 仅本版新增：lucide 图标需自备旋转动画（V1 用的是 PrimeVue `pi-spin`） */
.audit-spin {
    animation: audit-spin 1s linear infinite;
}

@keyframes audit-spin {
    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .audit-spin {
        animation: none;
    }
}
</style>
