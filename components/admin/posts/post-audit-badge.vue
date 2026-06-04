<template>
    <Button
        v-if="!auditResult && !loading"
        v-tooltip.top="$t('pages.admin.posts.audit.run_audit')"
        icon="pi pi-check-circle"
        text
        rounded
        severity="secondary"
        @click="$emit('run-audit')"
    />
    <Tag
        v-else-if="loading"
        icon="pi pi-spin pi-spinner"
        severity="info"
        :value="$t('pages.admin.posts.audit.running')"
    />
    <Tag
        v-else-if="auditResult"
        :value="auditResult.tier === 'good'
            ? $t('pages.admin.posts.audit.tier_good')
            : $t('pages.admin.posts.audit.tier_needs_improvement')"
        :severity="auditResult.tier === 'good' ? 'success' : 'warn'"
        class="post-audit-badge"
        :pt="{root: {style: {cursor: 'pointer'}}}"
        @click="$emit('show-detail', auditResult)"
    />
</template>

<script setup lang="ts">
import type { PostAuditResult } from '@/types/post'

defineProps<{
    auditResult: PostAuditResult | null
    loading: boolean
}>()

defineEmits<{
    'run-audit': []
    'show-detail': [result: PostAuditResult]
}>()
</script>
