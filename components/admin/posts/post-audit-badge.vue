<template>
    <AppTooltip v-if="!auditResult && !loading" :content="$t('pages.admin.posts.audit.run_audit')">
        <CaomeiButton
            icon-only
            rounded
            variant="ghost"
            :label="$t('pages.admin.posts.audit.run_audit')"
            @click="emit('run-audit')"
        >
            <template #icon>
                <CircleCheck :size="16" />
            </template>
        </CaomeiButton>
    </AppTooltip>
    <CaomeiTag v-else-if="loading" tone="primary">
        <template #icon>
            <LoaderCircle :size="12" class="post-audit-badge__spin" />
        </template>
        {{ $t('pages.admin.posts.audit.running') }}
    </CaomeiTag>
    <CaomeiTag
        v-else-if="auditResult"
        :tone="auditResult.tier === 'good' ? 'success' : 'warning'"
        class="post-audit-badge"
        @click="emit('show-detail', auditResult)"
    >
        {{ auditResult.tier === 'good'
            ? $t('pages.admin.posts.audit.tier_good')
            : $t('pages.admin.posts.audit.tier_needs_improvement') }}
    </CaomeiTag>
</template>

<script setup lang="ts">
import { CircleCheck, LoaderCircle } from '@lucide/vue'
import type { PostAuditResult } from '@/types/post'

/**
 * 「文章审计徽标」的实现（原 V2 过渡壳，2026-11-07 起为唯一实现）。
 *
 * 历史：本组件曾与 V1（`post-audit-badge.vue`）并存——`/admin/posts` 用 V2、编辑器 `/admin/posts/[id]`
 * 仍用 V1（消费处静态择库）。编辑器子批迁移后 V1 已删除，本组件成为唯一实现。
 *
 * 与旧 V1 的差异（均为有意，见迁移方案 §6.2）：
 * - `Button`（勾选圆圈字体图标 + `text rounded severity="secondary"`）→ `CaomeiButton`
 *   （lucide `CircleCheck` + `variant="ghost" rounded icon-only`），并补 `:label` 可访问名
 *   （V1 的纯图标按钮仅有 tooltip，无可访问名）；
 * - `Tag` 的 `severity="info"` → `tone="primary"`、`success` / `warn` → `success` / `warning`；
 * - V1 用 `:pt="{root:{style:{cursor:'pointer'}}}"` 内联指针样式，改为本组件内 scoped 类；
 * - 加载态图标由 PrimeVue 旋转加载图标换成 lucide `LoaderCircle` + 本组件内旋转动画。
 */
defineProps<{
    auditResult: PostAuditResult | null
    loading: boolean
}>()

const emit = defineEmits<{
    'run-audit': []
    'show-detail': [result: PostAuditResult]
}>()
</script>

<style lang="scss" scoped>
.post-audit-badge {
    cursor: pointer;

    &__spin {
        animation: post-audit-badge-spin 1s linear infinite;
    }
}

@keyframes post-audit-badge-spin {
    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .post-audit-badge__spin {
        animation: none;
    }
}
</style>
