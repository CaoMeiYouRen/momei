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
    agreementType: 'privacy_policy',
    defaultContent: `## 1. 概述
本隐私政策说明了本网站如何收集、使用和保护您的个人信息。`,
    endpoint: 'privacy-policy',
})
</script>
