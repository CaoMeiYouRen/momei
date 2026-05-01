<template>
    <LegalAgreementPage
        :agreement="agreement"
        :copy="copy"
        :format-date="formatDate"
    />
</template>

<script setup lang="ts">
import LegalAgreementPage from '@/components/legal-agreement-page.vue'
import { useLegalAgreementPage } from '@/composables/use-legal-agreement-page'

const { agreement, copy, formatDate } = await useLegalAgreementPage({
    agreementType: 'user_agreement',
    defaultContent: `## 1. 特别提示
本协议是您与本网站之间关于您访问和使用本站所订立的法律协议。`,
    endpoint: 'user-agreement',
})
</script>
