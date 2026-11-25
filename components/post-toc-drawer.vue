<template>
    <CaomeiButton
        class="post-detail__toc-trigger"
        variant="secondary"
        data-testid="post-toc-trigger"
        :label="$t('components.toc.title')"
        @click="openToc"
    >
        <template #icon>
            <List :size="16" />
        </template>
        {{ $t('components.toc.title') }}
    </CaomeiButton>

    <CaomeiDrawer
        :open="isOpen"
        position="right"
        size="sm"
        :title="$t('components.toc.title')"
        class="post-detail__toc-drawer"
        data-testid="post-toc-drawer"
        @update:open="handleOpenChange"
    >
        <TableOfContents
            :content="content"
            defer-scroll
            hide-title
            @navigate="handleNavigate"
        />
    </CaomeiDrawer>
</template>

<script setup lang="ts">
import { List } from '@lucide/vue'

const props = defineProps<{
    content: string
}>()

const isOpen = ref(false)
const pendingTocId = ref<string | null>(null)
let scrollToken = 0

/**
 * 点击目录项后：关闭抽屉 → 等 Reka 解除 body 滚动锁 → 再滚动到标题。
 *
 * 抽屉关闭后 body 仍有 `overflow: hidden`（退出动画结束后才解锁），此时 `window.scrollTo`
 * 会被忽略；逐帧等待解锁，最多 90 帧（约 1.5s @60fps，慢设备按帧计算更宽裕）。
 * 自增 token 让连续导航 / 重新打开抽屉时旧 rAF 链立即失效，避免两条链争抢落点。
 */
const scrollToHeading = (id: string, token: number, attempt = 0) => {
    if (token !== scrollToken) {
        return
    }

    const element = document.getElementById(id)
    if (!element) {
        return
    }

    const locked = getComputedStyle(document.body).overflow === 'hidden'
    if (locked && attempt < 90) {
        window.requestAnimationFrame(() => scrollToHeading(id, token, attempt + 1))
        return
    }

    window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth',
    })
}

const openToc = () => {
    isOpen.value = true
}

const handleOpenChange = (open: boolean) => {
    isOpen.value = open
}

const handleNavigate = (id: string) => {
    isOpen.value = false
    pendingTocId.value = id
}

watch(isOpen, (open) => {
    if (open) {
        /* 重新打开时清空陈旧目标：用户直接关闭（遮罩 / Esc）不应触发意外滚动。 */
        pendingTocId.value = null
        scrollToken++
        return
    }

    if (!pendingTocId.value) {
        return
    }

    const id = pendingTocId.value
    pendingTocId.value = null
    const token = ++scrollToken
    nextTick(() => scrollToHeading(id, token))
})

onBeforeUnmount(() => {
    scrollToken++
})
</script>
