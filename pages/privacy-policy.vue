<template>
    <div class="legal-page">
        <div class="legal-page__container">
            <h1 class="legal-page__title">
                {{ $t('pages.privacy_policy.title') }}
            </h1>
            <p class="legal-page__meta">
                {{ $t('pages.privacy_policy.last_updated') }}
            </p>

            <Divider />

            <div class="legal-page__content">
                <section>
                    <h2>1. 特别提示</h2>
                    <p class="notice">
                        {{ $t('legal.notice') }}
                    </p>
                    <p>
                        本隐私政策解释了 <strong>{{ siteOperator }}</strong>（以下简称“运营方”）在您访问 <strong>{{ siteUrl }}</strong> 时如何收集、使用和保护您的个人信息。
                    </p>
                </section>

                <section>
                    <h2>2. 我们收集的信息</h2>
                    <ul>
                        <li><strong>账户信息：</strong> 当您在本站注册时，我们会收集您的邮箱地址、用户名和密码（加密存储）。</li>
                        <li><strong>第三方登录：</strong> 如果您使用 GitHub 或 Google 登录，我们会从第三方获取您的唯一标识、头像和基本资料。</li>
                        <li><strong>访问日志：</strong> 我们会自动记录您的 IP 地址、浏览器类型和访问页面。</li>
                        <li><strong>统计数据：</strong> 我们可能使用第三方统计工具（如百度统计、Google Analytics）分析网站流量。</li>
                    </ul>
                </section>

                <section>
                    <h2>3. 信息的使用方式</h2>
                    <p>收集的信息主要用于：</p>
                    <ul>
                        <li>提供并验证您的账户服务。</li>
                        <li>改善网站用户体验。</li>
                        <li>发送订阅通知（仅在您主动订阅后）。</li>
                        <li>维护网站安全与稳定。</li>
                    </ul>
                </section>

                <section>
                    <h2>4. 信息的存储与安全</h2>
                    <p>您的个人信息存储在运营方控制的服务器中。我们采取合理的技术措施保障数据安全，但请注意互联网环境并非绝对安全。</p>
                </section>

                <section>
                    <h2>5. 第三方服务</h2>
                    <p>本站可能集成第三方服务，具体隐私政策请参考相关服务提供商：</p>
                    <ul>
                        <li>Better Auth (身份验证)</li>
                        <li>Sentry (错误监控)</li>
                        <li>Cloudflare (CDN 与安全)</li>
                        <li>第三方统计工具 (Google Analytics, Baidu)</li>
                    </ul>
                </section>

                <section>
                    <h2>6. 您的权利</h2>
                    <p>您可以随时在“个人设置”页面修改您的账户资料或注销账户。如需删除所有数据，请联系运营方。</p>
                </section>

                <section>
                    <h2>7. 联系方式</h2>
                    <p>如果您对本政策有任何疑问，请联系：</p>
                    <ul>
                        <li>{{ $t('legal.contact') }}: {{ contactEmail }}</li>
                    </ul>
                </section>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig.public.siteUrl
const siteOperator = runtimeConfig.public.siteOperator
const contactEmail = runtimeConfig.public.contactEmail

useHead({
    title: useI18n().t('pages.privacy_policy.title'),
})
</script>

<style lang="scss" scoped>
.legal-page {
    padding: 2rem 1rem;
    min-height: 100vh;
    background-color: var(--p-surface-0);

    &__container {
        max-width: 800px;
        margin: 0 auto;
    }

    &__title {
        font-size: 2.25rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: var(--p-text-color);
    }

    &__meta {
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
        margin-bottom: 2rem;
    }

    &__content {
        line-height: 1.75;
        color: var(--p-text-color);

        section {
            margin-bottom: 2rem;
        }

        h2 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid var(--p-content-border-color);
        }

        p {
            margin-bottom: 1rem;
        }

        ul {
            padding-left: 1.5rem;
            margin-bottom: 1rem;
        }

        .notice {
            background-color: var(--p-surface-100);
            padding: 1rem;
            border-left: 4px solid var(--p-primary-color);
            border-radius: 4px;
            font-style: italic;
        }
    }
}

:global(.dark) .legal-page {
    background-color: var(--p-surface-950);
}
</style>
