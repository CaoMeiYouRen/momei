<template>
    <div class="tools-section">
        <Accordion>
            <AccordionPanel value="bookmarklet">
                <AccordionHeader>
                    <div class="flex gap-2 items-center">
                        <i class="pi pi-bookmark" />
                        <span>{{ t('pages.admin.snippets.bookmarklet_title') }}</span>
                    </div>
                </AccordionHeader>
                <AccordionContent>
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
                                <i class="pi pi-bookmark" />
                                <span>{{ t('pages.admin.snippets.bookmarklet_button') }}</span>
                            </a>
                            <Button
                                icon="pi pi-copy"
                                :label="t('common.copy_code')"
                                text
                                size="small"
                                @click="copyBookmarklet"
                            />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionPanel>
        </Accordion>
    </div>
</template>

<script setup lang="ts">
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
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.copy_success'), life: 2000 })
    } catch (err) {
        toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.copy_failed'), life: 2000 })
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
            color: var(--p-text-muted-color);
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
                background-color: var(--p-primary-500);
                color: white;
                border-radius: 2rem;
                text-decoration: none;
                font-weight: 600;
                font-size: 0.875rem;
                box-shadow: 0 4px 12px var(--p-primary-200);
                transition: all 0.2s;
                cursor: move;

                &:hover {
                    background-color: var(--p-primary-600);
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px var(--p-primary-300);
                }

                :global(.dark) & {
                    box-shadow: 0 4px 12px rgb(0 0 0 / 0.3);
                }
            }
        }
    }
}
</style>
