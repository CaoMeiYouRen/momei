<template>
    <div v-if="shouldShow" class="compliance-info">
        <div class="compliance-info__content">
            <!-- ICP 备案信息 -->
            <NuxtLink
                v-if="icpNumber"
                :to="icpLink"
                target="_blank"
                class="compliance-info__link"
                rel="noopener noreferrer"
            >
                <span class="compliance-info__label">{{ $t('components.footer.compliance.icp') }}：</span>
                <span class="compliance-info__value">{{ icpNumber }}</span>
            </NuxtLink>

            <!-- 公安网安备案信息 -->
            <NuxtLink
                v-if="policeNumber"
                :to="policeLink"
                target="_blank"
                class="compliance-info__link"
                rel="noopener noreferrer"
            >
                <span class="compliance-info__label">{{ $t('components.footer.compliance.police') }}：</span>
                <span class="compliance-info__value">{{ policeNumber }}</span>
            </NuxtLink>
        </div>
    </div>
</template>

<script setup lang="ts">
// 环境变量获取
const publicConfig = useRuntimeConfig()

// 是否显示备案信息（默认false）
const showCompliance = computed(() => {
    return publicConfig.public.showComplianceInfo
})
const icpNumber = computed(() => publicConfig.public.icpLicenseNumber)
const policeNumber = computed(() => publicConfig.public.publicSecurityNumber)

// 计算属性 - 是否应该显示
const shouldShow = computed(() => {
    return showCompliance.value && (icpNumber.value || policeNumber.value)
})

// ICP 备案查询链接
const icpLink = computed(() => {
    if (!icpNumber.value) return ''
    const icpText = icpNumber.value.replace(/^.*?备案号/, '')
    // 工信部备案查询系统
    return `https://beian.miit.gov.cn/#/query/webSearch?site=${icpText}`
})

// 公安网安备案查询链接
const policeLink = computed(() => {
    if (!policeNumber.value) return ''
    // 公安备案管理系统
    return 'https://beian.mps.gov.cn/'
})
</script>

<style lang="scss" scoped>
.compliance-info {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--p-surface-border);
    text-align: center;

    &__content {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1.5rem;
        flex-wrap: wrap;
    }

    &__link {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        color: var(--p-text-muted-color);
        text-decoration: none;
        font-size: 0.75rem;
        transition: color 0.2s;
        line-height: 1.5;

        &:hover {
            color: var(--p-primary-color);
            text-decoration: underline;
        }
    }

    &__label {
        font-weight: 400;
        color: inherit;
    }

    &__value {
        font-family: '"Noto Serif SC", serif';
        font-weight: 500;
        color: var(--p-text-color-secondary);
    }
}

// 响应式设计
@media (max-width: 640px) {
    .compliance-info {
        &__content {
            flex-direction: column;
            gap: 0.75rem;
        }
    }
}
</style>
