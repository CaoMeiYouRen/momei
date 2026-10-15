<template>
    <CaomeiButton
        v-if="!auditResult && !loading"
        v-tooltip.top="$t('pages.admin.posts.audit.run_audit')"
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
 * 过渡用「文章审计徽标（caomei-ui 版）」。
 *
 * 背景：`PostAuditBadge` 同时被 B2 目标列表路由 `/admin/posts` 与编辑器路由 `/admin/posts/[id]` 消费。
 * 直接改写 V1 会让编辑器路由被动混用（页内 PrimeVue + 局部 caomei）。故并存期新增本过渡组件
 * ——**本批只交付过渡壳**；`/admin/posts` 改用本组件、`/admin/posts/[id]` 保持 V1 的动作在 posts 路由批次执行。
 *
 * **择库方式（本族与 `AppAvatarV2` / `AppUploaderV2` 不同，见迁移方案 §5.5）**：本族为
 * **admin 专属、消费者恰好两个（一迁移一未迁移）**且承载多 prop / 事件契约（`emit`）的壳；在组件内做
 * 路由择库会让状态、`open()` / `expose` 与事件契约出现第二份事实源。故采用**消费处静态择库**：
 * 由 `/admin/posts` 在自身迁移批次改用本组件，`/admin/posts/[id]` 继续使用 V1。
 *
 * 与 V1 的差异（均为有意，见迁移方案 §6.2）：
 * - `Button`（`pi pi-check-circle` + `text rounded severity="secondary"`）→ `CaomeiButton`
 *   （lucide `CircleCheck` + `variant="ghost" rounded icon-only`），并补 `:label` 可访问名
 *   （V1 的纯图标按钮仅有 tooltip，无可访问名）；
 * - `Tag` 的 `severity="info"` → `tone="primary"`、`success` / `warn` → `success` / `warning`；
 * - V1 用 `:pt="{root:{style:{cursor:'pointer'}}}"` 内联指针样式，改为本组件内 scoped 类；
 * - 加载态图标由 `pi pi-spin pi-spinner` 换成 lucide `LoaderCircle` + 本组件内旋转动画。
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
