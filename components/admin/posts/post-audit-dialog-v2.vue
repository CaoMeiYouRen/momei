<template>
    <!--
      浮层显式豁免（迁移方案 §5.5）：`Dialog` 属延后批次，本批维持 PrimeVue；
      其内部的 `Button` / `Tag` 属批次在册族，随本过渡组件迁移到 caomei-ui。
      `ProgressBar` 不在 B2 在册族（随 B4 展示批次），维持 PrimeVue。
    -->
    <Dialog
        :visible="visible"
        :header="$t('pages.admin.posts.audit.dialog_title')"
        :style="{width: '540px'}"
        :modal="true"
        @update:visible="emit('close')"
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
    </Dialog>
</template>

<script setup lang="ts">
import { LoaderCircle, RefreshCw, X } from '@lucide/vue'
import type { PostAuditResult } from '@/types/post'

/**
 * 过渡用「文章审计详情浮层（caomei-ui 版）」。
 *
 * 背景与择库方式同 `PostAuditBadgeV2`（见该文件注释与迁移方案 §5.5）：本族为 admin 专属、
 * 消费者恰好两个（B2 目标 `/admin/posts` 与编辑器 `/admin/posts/[id]`），
 * 故采用**消费处静态择库**，由已迁移路由使用本组件，编辑器路由继续使用 V1。
 *
 * 与 V1 的差异（均为有意，见迁移方案 §6.2）：
 * - `Button` → `CaomeiButton`：页脚两个按钮在 V1 走 `:label` + `icon`（可见文案），
 *   迁移后可见文案落**默认插槽**、图标走 lucide `#icon`（caomei `label` 只映射可访问名）；
 *   `severity="secondary"` → `variant="secondary"`、`text` → `variant="ghost"`；
 * - `Tag` 的 `severity="info"` → `tone="primary"`、`success` / `warn` → `success` / `warning`；
 * - 加载态图标由 `pi pi-spin pi-spinner` 换成 lucide `LoaderCircle` + 本组件内旋转动画；
 * - `Dialog` 与 `ProgressBar` 不在 B2 在册族，维持 PrimeVue。
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
