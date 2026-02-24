<template>
    <div
        ref="containerRef"
        class="canvas-nest-effect"
        aria-hidden="true"
    />
</template>

<script setup lang="ts">
import CanvasNest from 'canvas-nest.js'
import { toBoolean, toNumber } from '@/utils/shared/coerce'

const { siteConfig } = useMomeiConfig()
const { canLoadEffect, runWhenIdle } = useClientEffectGuard()

const containerRef = ref<HTMLElement | null>(null)
const isInitialized = ref(false)
let canvasNestInstance: { destroy: () => void } | null = null

interface CanvasNestConfig {
    color?: string
    pointColor?: string
    opacity?: number
    count?: number
    zIndex?: number
}

const config = computed(() => {
    const settings = siteConfig.value || {}

    return {
        enabled: toBoolean(settings.canvasNestEnabled, false),
        optionsJson: settings.canvasNestOptionsJson,
        mobileEnabled: toBoolean(settings.canvasNestMobileEnabled, false),
        minWidth: toNumber(settings.canvasNestMinWidth, 1024),
        dataSaverBlock: toBoolean(settings.canvasNestDataSaverBlock, true),
    }
})

const parseCanvasNestOptions = (raw: unknown): CanvasNestConfig => {
    if (!raw) {
        return {}
    }

    let parsed: unknown = raw
    if (typeof raw === 'string') {
        try {
            parsed = JSON.parse(raw)
        } catch {
            console.warn('Invalid canvasNestOptionsJson, fallback to defaults')
            return {}
        }
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {}
    }

    const data = parsed as Record<string, unknown>
    const result: CanvasNestConfig = {}

    if (typeof data.color === 'string') {
        result.color = data.color
    }
    if (typeof data.pointColor === 'string') {
        result.pointColor = data.pointColor
    }
    if (typeof data.opacity === 'number' && Number.isFinite(data.opacity)) {
        result.opacity = data.opacity
    }
    if (typeof data.count === 'number' && Number.isFinite(data.count)) {
        result.count = data.count
    }
    if (typeof data.zIndex === 'number' && Number.isFinite(data.zIndex)) {
        result.zIndex = data.zIndex
    }

    return result
}

const shouldLoadCanvasNest = () => {
    const current = config.value
    return canLoadEffect({
        enabled: current.enabled,
        minWidth: current.minWidth,
        mobileEnabled: current.mobileEnabled,
        dataSaverBlock: current.dataSaverBlock,
        slowNetworkBlock: current.dataSaverBlock,
    })
}

const initCanvasNest = async () => {
    if (isInitialized.value || !shouldLoadCanvasNest()) {
        return
    }

    const container = containerRef.value
    if (!container) {
        return
    }

    try {
        const defaultOptions: CanvasNestConfig = {
            color: '0,0,0',
            pointColor: '0,0,0',
            opacity: 0.7,
            count: 88,
            zIndex: -1,
        }
        const userOptions = parseCanvasNestOptions(config.value.optionsJson)

        canvasNestInstance = new CanvasNest(container, {
            ...defaultOptions,
            ...userOptions,
        }) as { destroy: () => void }

        isInitialized.value = true
    } catch (error) {
        console.warn('CanvasNest init skipped:', error)
    }
}

onMounted(() => {
    if (!shouldLoadCanvasNest()) {
        return
    }

    runWhenIdle(() => {
        initCanvasNest()
    }, { timeout: 4000, fallbackDelay: 1200 })
})

onBeforeUnmount(() => {
    canvasNestInstance?.destroy()
    canvasNestInstance = null
    isInitialized.value = false
})
</script>

<style lang="scss" scoped>
.canvas-nest-effect {
    position: fixed;
    inset: 0;
    pointer-events: none;
}
</style>
