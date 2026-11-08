<template>
    <div class="tools-section">
        <CaomeiAccordion>
            <CaomeiAccordionItem value="bookmarklet">
                <template #trigger>
                    <div class="flex gap-2 items-center">
                        <Bookmark :size="16" />
                        <span>{{ t('pages.admin.snippets.bookmarklet_title') }}</span>
                    </div>
                </template>
                <div class="bookmarklet-content">
                    <p class="bookmarklet-desc">
                        {{ t('pages.admin.snippets.bookmarklet_desc') }}
                    </p>
                    <div class="bookmarklet-actions">
                        <a
                            :href="bookmarkletCode"
                            class="bookmarklet-link-btn"
                            @click.prevent
                        >
                            <Bookmark :size="16" />
                            <span>{{ t('pages.admin.snippets.bookmarklet_button') }}</span>
                        </a>
                        <CaomeiButton
                            variant="ghost"
                            tone="neutral"
                            size="sm"
                            @click="copyBookmarklet"
                        >
                            <template #icon>
                                <Copy :size="16" />
                            </template>
                            {{ t('common.copy_code') }}
                        </CaomeiButton>
                    </div>
                </div>
            </CaomeiAccordionItem>
        </CaomeiAccordion>
    </div>
</template>

<script setup lang="ts">
import { useToast } from 'caomei-ui'
import { Bookmark, Copy } from '@lucide/vue'
const { t } = useI18n()
const toast = useToast()
const config = useRuntimeConfig()

const bookmarkletCode = computed(() => {
    const baseUrl = config.public.siteUrl
    return `javascript:(function(){var t=document.title,u=window.location.href,c=window.getSelection().toString(),b="${baseUrl}/admin/snippets/capture",l=b+"?content="+encodeURIComponent(c)+"&url="+encodeURIComponent(u)+"&title="+encodeURIComponent(t)+"&source=bookmarklet";window.open(l,"momei_capture","width=600,height=500,location=no,menubar=no,status=no,toolbar=no")})();`
})

const copyBookmarklet = async () => {
    try {
        await navigator.clipboard.writeText(bookmarkletCode.value)
        toast.show({ tone: 'success', title: t('common.success'), description: t('common.copy_success'), duration: 2000 })
    } catch (err) {
        toast.show({ tone: 'danger', title: t('common.error'), description: t('common.copy_failed'), duration: 2000 })
    }
}
</script>

<style lang="scss" scoped>
.tools-section {
    width: 100%;
    margin-bottom: 2.5rem;

    .bookmarklet-content {
        padding: 0.5rem;

        .bookmarklet-desc {
            margin-bottom: 1.5rem;
            color: var(--caomei-color-text-muted);
            font-size: 0.9375rem;
            line-height: 1.6;
        }

        .bookmarklet-actions {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex-wrap: wrap;

            .bookmarklet-link-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.625rem 1.25rem;
                background-color: var(--m-primary-500);
                color: white;
                border-radius: 2rem;
                text-decoration: none;
                font-weight: 600;
                font-size: 0.875rem;
                box-shadow: 0 4px 12px var(--m-primary-200);
                transition: all 0.2s;
                cursor: move;

                &:hover {
                    background-color: var(--m-primary-600);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px var(--m-primary-300);
                }

                :global(.dark) & {
                    box-shadow: 0 4px 12px rgb(0 0 0 / 0.3);
                }
            }
        }
    }
}
</style>
