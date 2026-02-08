<template>
    <Button
        v-if="!isNew"
        v-tooltip="$t('pages.admin.posts.wechatsync.tooltip')"
        icon="pi pi-share-alt"
        text
        rounded
        @click="handleSync"
    />
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'

const props = defineProps<{
    post: any
    isNew: boolean
}>()

const { t } = useI18n()
const toast = useToast()

const handleSync = () => {
    // @ts-ignore
    if (typeof window !== 'undefined' && window.ArticleSync) {
        try {
            // WechatSync bridge
            // @ts-ignore
            window.ArticleSync.output({
                title: props.post.title,
                content: props.post.content,
                // If we want to pass more metadata
                // author: '',
                // source_url: '',
            })
        } catch (error) {
            console.error('WechatSync error:', error)
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('pages.admin.posts.wechatsync.failed'),
                life: 3000,
            })
        }
    } else {
        toast.add({
            severity: 'warn',
            summary: t('pages.admin.posts.wechatsync.extension_not_found'),
            detail: t('pages.admin.posts.wechatsync.extension_help'),
            life: 5000,
        })
        // Open extension store link in new tab?
        // window.open('https://wechatsync.com', '_blank')
    }
}
</script>
