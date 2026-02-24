<template>
    <div class="live2d-widget" aria-hidden="true" />
</template>

<script setup lang="ts">
import { toBoolean, toNumber } from '@/utils/shared/coerce'

const { siteConfig } = useMomeiConfig()

const DEFAULT_LIVE2D_PATH = 'https://unpkg.com/live2d-widgets@1.0.0/dist/'

const isInitialized = ref(false)
const { canLoadEffect, runWhenIdle } = useClientEffectGuard()

type Live2dLogLevel = 'error' | 'warn' | 'info' | 'trace'

interface Live2dWidgetOptions {
    waifuPath: string
    cdnPath?: string
    cubism2Path: string
    cubism5Path: string
    modelId?: number
    tools: string[]
    drag: boolean
    logLevel: Live2dLogLevel
}

const config = computed(() => {
    const settings = siteConfig.value || {}
    const live2dPath = String(settings.live2dScriptUrl || DEFAULT_LIVE2D_PATH)
    const normalizedPath = live2dPath.endsWith('/') ? live2dPath : `${live2dPath}/`

    return {
        enabled: toBoolean(settings.live2dEnabled, false),
        live2dPath: normalizedPath,
        waifuPath: String(settings.live2dModelUrl || `${normalizedPath}waifu-tips.json`),
        mobileEnabled: toBoolean(settings.live2dMobileEnabled, false),
        minWidth: toNumber(settings.live2dMinWidth, 768),
        dataSaverBlock: toBoolean(settings.live2dDataSaverBlock, true),
    }
})

const parseLive2dOptions = (raw: unknown): Partial<Live2dWidgetOptions> => {
    if (!raw) return {}

    let parsed: unknown = raw
    if (typeof raw === 'string') {
        try {
            parsed = JSON.parse(raw)
        } catch {
            console.warn('Invalid live2dOptionsJson, fallback to defaults')
            return {}
        }
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {}
    }

    const data = parsed as Record<string, unknown>
    const result: Partial<Live2dWidgetOptions> = {}

    if (typeof data.waifuPath === 'string') {
        result.waifuPath = data.waifuPath
    }
    if (typeof data.cdnPath === 'string') {
        result.cdnPath = data.cdnPath
    }
    if (typeof data.cubism2Path === 'string') {
        result.cubism2Path = data.cubism2Path
    }
    if (typeof data.cubism5Path === 'string') {
        result.cubism5Path = data.cubism5Path
    }
    if (typeof data.modelId === 'number' && Number.isFinite(data.modelId)) {
        result.modelId = data.modelId
    }
    if (Array.isArray(data.tools) && data.tools.every((item) => typeof item === 'string')) {
        result.tools = data.tools as string[]
    }
    if (typeof data.drag === 'boolean') {
        result.drag = data.drag
    }
    if (data.logLevel === 'error' || data.logLevel === 'warn' || data.logLevel === 'info' || data.logLevel === 'trace') {
        result.logLevel = data.logLevel
    }

    return result
}

const shouldLoadLive2d = () => {
    const current = config.value
    return canLoadEffect({
        enabled: current.enabled,
        minWidth: current.minWidth,
        mobileEnabled: current.mobileEnabled,
        dataSaverBlock: current.dataSaverBlock,
        slowNetworkBlock: current.dataSaverBlock,
    })
}

const loadExternalResource = (url: string, type: 'css' | 'js') => {
    return new Promise<void>((resolve, reject) => {
        const selector = type === 'css'
            ? `link[rel="stylesheet"][href="${url}"]`
            : `script[src="${url}"]`
        const existingTag = document.querySelector(selector) as HTMLLinkElement | HTMLScriptElement | null

        if (existingTag) {
            if (existingTag.getAttribute('data-loaded') === 'true') {
                resolve()
                return
            }

            existingTag.addEventListener('load', () => resolve(), { once: true })
            existingTag.addEventListener('error', () => reject(new Error(`Live2D ${type} load failed`)), { once: true })
            return
        }

        const tag = type === 'css'
            ? document.createElement('link')
            : document.createElement('script')

        if (type === 'css') {
            const styleTag = tag as HTMLLinkElement
            styleTag.rel = 'stylesheet'
            styleTag.href = url
        } else {
            const scriptTag = tag as HTMLScriptElement
            scriptTag.type = 'module'
            scriptTag.src = url
            scriptTag.async = true
            scriptTag.defer = true
        }

        tag.onload = () => {
            tag.setAttribute('data-loaded', 'true')
            resolve()
        }
        tag.onerror = () => reject(new Error(`Live2D ${type} load failed`))
        document.head.appendChild(tag)
    })
}

const patchImageCrossOrigin = () => {
    if (window.__live2dImagePatched) {
        return
    }

    const OriginalImage = window.Image
    const PatchedImage = function (...args: ConstructorParameters<typeof Image>) {
        const img = new OriginalImage(...args)
        img.crossOrigin = 'anonymous'
        return img
    }
    window.Image = PatchedImage as unknown as typeof Image
    window.Image.prototype = OriginalImage.prototype
    window.__live2dImagePatched = true
}

const initLive2d = async () => {
    if (isInitialized.value || !shouldLoadLive2d()) return

    try {
        patchImageCrossOrigin()

        await Promise.all([
            loadExternalResource(`${config.value.live2dPath}waifu.css`, 'css'),
            loadExternalResource(`${config.value.live2dPath}waifu-tips.js`, 'js'),
        ])

        if (typeof window.initWidget !== 'function') {
            return
        }

        const defaultOptions: Live2dWidgetOptions = {
            waifuPath: config.value.waifuPath,
            cubism2Path: `${config.value.live2dPath}live2d.min.js`,
            cubism5Path: 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
            tools: ['hitokoto', 'asteroids', 'switch-model', 'switch-texture', 'photo', 'info', 'quit'],
            drag: false,
            logLevel: 'warn',
        }

        const userOptions = parseLive2dOptions(siteConfig.value?.live2dOptionsJson)
        window.initWidget({ ...defaultOptions, ...userOptions })
        isInitialized.value = true
    } catch (error) {
        console.warn('Live2D init skipped:', error)
    }
}

onMounted(() => {
    if (!shouldLoadLive2d()) return

    runWhenIdle(() => {
        initLive2d()
    }, { timeout: 4000, fallbackDelay: 1200 })
})
</script>

<script lang="ts">
declare global {
    interface Window {
        initWidget?: (options: {
            waifuPath: string
            cdnPath?: string
            cubism2Path: string
            cubism5Path: string
            modelId?: number
            tools: string[]
            logLevel: 'error' | 'warn' | 'info' | 'trace'
            drag: boolean
        }) => void
        __live2dImagePatched?: boolean
    }
}
</script>

<style lang="scss" scoped>
.live2d-widget {
    position: fixed;
    width: 0;
    height: 0;
}
</style>
