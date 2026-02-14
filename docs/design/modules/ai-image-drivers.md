# AI 图像驱动补全设计文档 (AI Image Drivers Completion)

本文档定义了墨梅博客中 AI 图像生成驱动补全功能的实现方案。该功能旨在完成对 Gemini 2 Pro Image 和 Stable Diffusion (WebUI/ComfyUI API) 的原生驱动适配，扩展现有的 AI 图像生成能力。

## 1. 核心目标

- **多驱动支持**: 完成对 Gemini 2 Pro Image 和 Stable Diffusion 的驱动实现
- **统一接口**: 所有驱动共享相同的 `AIImageProvider` 接口
- **异步处理**: 支持长时间绘图任务的异步状态追踪
- **图像持久化**: 自动下载临时 URL 至本地存储
- **灵活配置**: 支持自定义 API Endpoint 和模型参数

## 2. 技术方案

### 2.1 驱动架构

所有图像提供者实现统一的 `AIImageProvider` 接口：

```typescript
// types/ai.ts
export interface AIImageProvider {
    name: string
    type: 'text-to-image' | 'image-to-image' | 'inpainting'

    // 生成图像
    generateImage(options: AIImageOptions): Promise<AIImageResponse>

    // 预估成本
    estimateCost(options: AIImageOptions): Promise<number>

    // 验证配置
    validateConfig(): Promise<boolean>
}

export interface AIImageOptions {
    prompt: string
    negativePrompt?: string
    size?: `${number}x${number}`  // 如 "1024x1024"
    count?: number  // 生成数量
    style?: string  // 风格预设
    seed?: number  // 随机种子
    referenceImage?: string  // 参考（用于 img2img）
}

export interface AIImageResponse {
    images: Array<{
        url: string
        width: number
        height: number
        mimeType?: string
    }>
    usage?: {
        model: string
        tokens?: number
        cost?: number
    }
    metadata?: Record<string, any>
}
```

### 2.2 已实现驱动状态

| 驱动 | 状态 | 说明 |
|:---|:---|:---|
| **豆包 (Doubao)** | ✅ 已实现 | 当前主选 |
| **OpenAI DALL-E 3** | ✅ 代码就绪 | 待测试 |
| **Gemini 2 Pro Image** | ⬜ 待实现 | 本文档重点 |
| **Stable Diffusion** | ⬜ 待实现 | 本文档重点 |

## 3. Gemini 2 Pro Image 驱动

### 3.1 技术调研

#### API 特性

- **端点**: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateImage`
- **认证**: Bearer Token (OAuth 2.0) 或 API Key
- **模型**: `imagen-3.0-generate-001`
- **支持尺寸**: 1024x1024, 1024x768, 768x1024, 等
- **响应格式**: JSON 包含图像的 base64 编码或 URL

#### 定价

| 分辨率 | 价格 | 质量等级 |
|:---|:---|:---|
| 1024x1024 | $0.035/张 | 标准 |
| 1024x1024 | $0.080/张 | 高质量 |
| 2048x2048 | $0.120/张 | 标准 |

### 3.2 实现方案

```typescript
// server/services/ai/image/gemini.ts
export class GeminiImageProvider implements AIImageProvider {
    name = 'Gemini 2 Pro Image'
    type = 'text-to-image'

    async generateImage(options: AIImageOptions): Promise<AIImageResponse> {
        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is required')
        }

        // 支持自定义 endpoint
        const endpoint = process.env.GEMINI_API_ENDPOINT || 'https://generativelanguage.googleapis.com'
        const model = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-001'

        const requestBody = {
            prompt: {
                text: options.prompt,
            },
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                    threshold: 'BLOCK_LOW_AND_ABOVE',
                },
            ],
            imageGenerationParams: {
                numberOfImages: options.count || 1,
                aspectRatio: this.parseAspectRatio(options.size || '1024x1024'),
                negativePrompt: options.negativePrompt,
                seed: options.seed,
            },
        }

        const response = await fetch(
            `${endpoint}/v1beta/models/${model}:generateImage?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            }
        )

        if (!response.ok) {
            const error = await response.json()
            throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`)
        }

        const data = await response.json()

        return {
            images: data.generatedImages.map((img: any) => ({
                url: img.bytesBase64Encoded
                    ? `data:image/png;base64,${img.bytesBase64Encoded}`
                    : img.imageUri,
                width: img.width || parseInt(options.size?.split('x')[0] || '1024'),
                height: img.height || parseInt(options.size?.split('x')[1] || '1024'),
                mimeType: 'image/png',
            })),
            usage: {
                model,
                cost: await this.estimateCost(options),
            },
        }
    }

    async estimateCost(options: AIImageOptions): Promise<number> {
        const size = options.size || '1024x1024'
        const count = options.count || 1

        // 基础定价
        let costPerImage = 0.035  // 默认标准质量

        if (size === '2048x2048') {
            costPerImage = 0.120
        }

        return costPerImage * count
    }

    async validateConfig(): Promise<boolean> {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
            )
            return response.ok
        } catch {
            return false
        }
    }

    private parseAspectRatio(size: string): string {
        const [width, height] = size.split('x').map(Number)
        const ratio = width / height

        if (Math.abs(ratio - 1) < 0.01) return '1:1'
        if (Math.abs(ratio - 4/3) < 0.01) return '4:3'
        if (Math.abs(ratio - 3/4) < 0.01) return '3:4'
        if (Math.abs(ratio - 16/9) < 0.01) return '16:9'
        if (Math.abs(ratio - 9/16) < 0.01) return '9:16'

        return '1:1'  // 默认
    }
}
```

### 3.3 环境变量

```env
# Gemini Image Generation
GEMINI_API_KEY=
GEMINI_IMAGE_MODEL=imagen-3.0-generate-001
GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com
```

## 4. Stable Diffusion 驱动

### 4.1 技术调研

#### API 选项

Stable Diffusion 有多种 API 接入方式：

| 方式 | 复杂度 | 成本 | 灵活性 | 推荐 |
|:---|:---|:---|:---|:---|
| **Automatic1111 WebUI** | ⭐⭐ | 本地免费 | 中 | ⭐⭐⭐⭐ |
| **ComfyUI** | ⭐⭐⭐ | 本地免费 | 很高 | ⭐⭐⭐⭐⭐ |
| **云服务 (Replicate)** | ⭐ | 按次计费 | 低 | ⭐⭐⭐ |

本设计优先支持 **Automatic1111 WebUI API**，因为它提供了最标准的 REST 接口。

#### WebUI API 特性

- **端点**: `POST http://localhost:7860/sdapi/v1/txt2img`
- **认证**: 可选（生产环境应配置）
- **支持操作**: txt2img, img2img, extra-single-image
- **响应格式**: JSON 包含 base64 编码图像

### 4.2 实现方案

```typescript
// server/services/ai/image/stable-diffusion.ts
export class StableDiffusionProvider implements AIImageProvider {
    name = 'Stable Diffusion'
    type = 'text-to-image'

    async generateImage(options: AIImageOptions): Promise<AIImageResponse> {
        const endpoint = process.env.SD_API_ENDPOINT || 'http://localhost:7860'
        const apiKey = process.env.SD_API_KEY

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`
        }

        // 解析尺寸
        const [width, height] = (options.size || '1024x1024').split('x').map(Number)

        const requestBody = {
            prompt: options.prompt,
            negative_prompt: options.negativePrompt || '',
            width,
            height,
            steps: 30,  // 默认步数
            cfg_scale: 7,  // 默认 CFG
            seed: options.seed || -1,
            batch_size: options.count || 1,
            sampler_name: 'DPM++ 2M Karras',  // 默认采样器
        }

        const response = await fetch(`${endpoint}/sdapi/v1/txt2img`, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
            throw new Error(`Stable Diffusion API error: ${response.statusText}`)
        }

        const data = await response.json()

        return {
            images: data.images.map((base64: string, index: number) => ({
                url: `data:image/png;base64,${base64}`,
                width: data.parameters.width,
                height: data.parameters.height,
                mimeType: 'image/png',
            })),
            usage: {
                model: 'stable-diffusion',
                cost: await this.estimateCost(options),
            },
            metadata: {
                info: data.info,
                parameters: data.parameters,
            },
        }
    }

    async estimateCost(options: AIImageOptions): Promise<number> {
        // 本地部署无成本，云服务根据实际实现
        return 0
    }

    async validateConfig(): Promise<boolean> {
        try {
            const endpoint = process.env.SD_API_ENDPOINT || 'http://localhost:7860'
            const response = await fetch(`${endpoint}/sdapi/v1/sd-models`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),  // 5 秒超时
            })
            return response.ok
        } catch {
            return false
        }
    }
}
```

### 4.3 Img2Img 支持

```typescript
// 扩展支持图像变体
export interface SDImg2ImgOptions extends AIImageOptions {
    referenceImage: string  // 必需
    denoisingStrength: number  // 0-1, 默认 0.75
    masking?: {
        maskImage: string
        maskBlur: number
        inpaintFullRes?: boolean
    }
}

async generateImage(options: SDImg2ImgOptions): Promise<AIImageResponse> {
    // ... 类似 txt2img，但使用 /sdapi/v1/img2img 端点
    const requestBody = {
        init_images: [options.referenceImage],
        prompt: options.prompt,
        negative_prompt: options.negativePrompt,
        denoising_strength: options.denoisingStrength ?? 0.75,
        mask_image: options.masking?.maskImage,
        mask_blur: options.masking?.maskBlur ?? 4,
        inpaint_full_res: options.masking?.inpaintFullRes ?? false,
        // ... 其他参数
    }

    const response = await fetch(`${endpoint}/sdapi/v1/img2img`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
    })

    // ... 处理响应
}
```

### 4.4 环境变量

```env
# Stable Diffusion (本地部署)
SD_API_ENDPOINT=http://localhost:7860
SD_API_KEY=  # 可选

# 或使用云服务 (如 Replicate)
REPLICATE_API_TOKEN=
SD_CLOUD_MODEL=stability-ai/sdxl
```

## 5. 驱动注册与发现

### 5.1 驱动工厂

```typescript
// server/services/ai/image/factory.ts
import { DoubaoImageProvider } from './doubao'
import { GeminiImageProvider } from './gemini'
import { StableDiffusionProvider } from './stable-diffusion'
import { DalleImageProvider } from './dalle'

interface ProviderConfig {
    class: new () => AIImageProvider
    envKey: string
    enabled: () => boolean
}

const AVAILABLE_PROVIDERS: Record<string, ProviderConfig> = {
    doubao: {
        class: DoubaoImageProvider,
        envKey: 'DOUBAO_API_KEY',
        enabled: () => !!process.env.DOUBAO_API_KEY,
    },
    gemini: {
        class: GeminiImageProvider,
        envKey: 'GEMINI_API_KEY',
        enabled: () => !!process.env.GEMINI_API_KEY,
    },
    'stable-diffusion': {
        class: StableDiffusionProvider,
        envKey: 'SD_API_ENDPOINT',
        enabled: () => !!process.env.SD_API_ENDPOINT,
    },
    dalle: {
        class: DalleImageProvider,
        envKey: 'OPENAI_API_KEY',
        enabled: () => !!process.env.OPENAI_API_KEY,
    },
}

export async function getAvailableImageProviders(): Promise<string[]> {
    const available: string[] = []

    for (const [key, config] of Object.entries(AVAILABLE_PROVIDERS)) {
        if (config.enabled()) {
            try {
                const provider = new config.class()
                if (await provider.validateConfig()) {
                    available.push(key)
                }
            } catch (error) {
                logger.warn(`Provider ${key} config validation failed:`, error)
            }
        }
    }

    return available
}

export async function getImageProvider(name: string): Promise<AIImageProvider> {
    const config = AVAILABLE_PROVIDERS[name]
    if (!config || !config.enabled()) {
        throw new Error(`Image provider ${name} is not available`)
    }

    const provider = new config.class()
    if (!(await provider.validateConfig())) {
        throw new Error(`Image provider ${name} configuration is invalid`)
    }

    return provider
}

export function getDefaultImageProvider(): string {
    return process.env.DEFAULT_IMAGE_PROVIDER || 'doubao'
}
```

## 6. API 接口设计

### 6.1 图像生成接口

```typescript
// POST /api/ai/images/generate
interface ImageGenerationRequest {
    provider: 'doubao' | 'gemini' | 'stable-diffusion' | 'dalle'
    prompt: string
    negativePrompt?: string
    size?: '512x512' | '1024x1024' | '1024x768' | '768x1024'
    count?: number  // 默认 1，最大 4
    style?: string  // 风格预设
    seed?: number
    referenceImage?: string  // img2img
    store?: boolean  // 是否存储到本地，默认 true
}

interface ImageGenerationResponse {
    taskId: string  // 异步任务 ID
    estimatedCost: number
    estimatedTime: number  // 秒
}

// GET /api/ai/images/tasks/:taskId
interface ImageTaskResponse {
    taskId: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    images?: Array<{
        url: string
        width: number
        height: number
        mimeType: string
    }>
    error?: string
}
```

### 6.2 驱动状态接口

```typescript
// GET /api/ai/images/providers
interface ProvidersResponse {
    available: string[]
    default: string
    providers: Array<{
        id: string
        name: string
        type: string
        capabilities: {
            sizes: string[]
            maxCount: number
            supportImg2Img: boolean
            supportInpainting: boolean
        }
    }>
}
```

## 7. 前端实现

### 7.1 图像生成对话框

```vue
<template>
    <Dialog v-model:visible="showDialog" header="AI 生成封面图" :style="{ width: '600px' }">
        <div class="image-generator">
            <div class="form-section">
                <label>提示词</label>
                <Textarea
                    v-model="prompt"
                    rows="4"
                    placeholder="描述你想要生成的图像..."
                />
            </div>

            <div class="form-section">
                <label>负面提示词</label>
                <InputText
                    v-model="negativePrompt"
                    placeholder="不希望出现的内容..."
                />
            </div>

            <div class="form-row">
                <div class="form-field">
                    <label>提供者</label>
                    <Dropdown
                        v-model="selectedProvider"
                        :options="providers"
                        optionLabel="name"
                        optionValue="id"
                        :disabled="isGenerating"
                    />
                </div>
                <div class="form-field">
                    <label>尺寸</label>
                    <Dropdown
                        v-model="selectedSize"
                        :options="availableSizes"
                        :disabled="isGenerating"
                    />
                </div>
            </div>

            <div class="form-section">
                <label>风格预设</label>
                <div class="style-presets">
                    <Button
                        v-for="style in stylePresets"
                        :key="style.id"
                        :label="style.name"
                        :severity="selectedStyle === style.id ? 'primary' : 'secondary'"
                        outlined
                        @click="applyStylePreset(style)"
                    />
                </div>
            </div>

            <div v-if="estimatedCost" class="cost-info">
                <Message severity="info" :closable="false">
                    预估成本: {{ estimatedCost.toFixed(4) }} USD
                </Message>
            </div>

            <div v-if="generatedImages.length > 0" class="generated-images">
                <Galleria
                    :images="generatedImages"
                    :numVisible="4"
                    :showThumbnails="true"
                >
                    <template #item="slotProps">
                        <Image :src="slotProps.item.url" alt="Generated image" />
                    </template>
                </Galleria>
            </div>

            <div v-if="isGenerating" class="generation-progress">
                <ProgressBar :value="progress" mode="indeterminate" />
                <p>正在生成中，请稍候...</p>
            </div>
        </div>

        <template #footer>
            <Button label="取消" severity="secondary" @click="showDialog = false" />
            <Button
                label="生成"
                :loading="isGenerating"
                :disabled="!prompt"
                @click="generate"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
const showDialog = defineModel<boolean>('visible')
const emit = defineEmits<{
    select: [image: { url: string; width: number; height: number }]
}>()

const prompt = ref('')
const negativePrompt = ref('')
const selectedProvider = ref('doubao')
const selectedSize = ref('1024x1024')
const selectedStyle = ref<string | null>(null)
const isGenerating = ref(false)
const progress = ref(0)
const generatedImages = ref<Array<{ url: string; width: number; height: number }>>([])
const estimatedCost = ref(0)

const providers = ref<Array<{ id: string; name: string }>>([])
const availableSizes = computed(() => {
    const provider = providers.value.find(p => p.id === selectedProvider.value)
    return provider?.capabilities?.sizes || ['1024x1024']
})

const stylePresets = [
    { id: 'realistic', name: '写实风格', prompt: 'photorealistic, highly detailed, 8k' },
    { id: 'anime', name: '动漫风格', prompt: 'anime style, vibrant colors' },
    { id: 'watercolor', name: '水彩风格', prompt: 'watercolor painting, artistic' },
    { id: 'minimalist', name: '极简风格', prompt: 'minimalist, clean, simple' },
]

async function loadProviders() {
    const data = await $fetch<ProvidersResponse>('/api/ai/images/providers')
    providers.value = data.providers
    selectedProvider.value = data.default
}

async function generate() {
    isGenerating.value = true
    progress.value = 0

    try {
        const response = await $fetch<ImageGenerationResponse>('/api/ai/images/generate', {
            method: 'POST',
            body: {
                provider: selectedProvider.value,
                prompt: prompt.value,
                negativePrompt: negativePrompt.value,
                size: selectedSize.value,
                count: 1,
            },
        })

        // 轮询任务状态
        const interval = setInterval(async () => {
            const status = await $fetch<ImageTaskResponse>(`/api/ai/images/tasks/${response.taskId}`)

            if (status.status === 'completed') {
                clearInterval(interval)
                generatedImages.value = status.images!
                isGenerating.value = false
                progress.value = 100
            } else if (status.status === 'failed') {
                clearInterval(interval)
                toast.add({
                    severity: 'error',
                    summary: '生成失败',
                    detail: status.error,
                })
                isGenerating.value = false
            } else {
                progress.value = status.progress
            }
        }, 2000)
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: '生成失败',
            detail: error.message,
        })
        isGenerating.value = false
    }
}

function applyStylePreset(style: typeof stylePresets[0]) {
    selectedStyle.value = style.id
    prompt.value = `${prompt.value} ${style.prompt}`.trim()
}

onMounted(() => {
    loadProviders()
})

watch(selectedProvider, () => {
    // 更新预估成本
    updateEstimatedCost()
})

watch(selectedSize, () => {
    updateEstimatedCost()
})

function updateEstimatedCost() {
    // 调用 API 获取预估成本
    // ...
}
</script>
```

### 7.2 风格预设系统

```typescript
// utils/ai/image-presets.ts
export interface ImageStylePreset {
    id: string
    name: string
    promptSuffix: string
    negativePrompt?: string
    recommendedSize?: string
}

export const STYLE_PRESETS: ImageStylePreset[] = [
    {
        id: 'blog-cover',
        name: '博客封面',
        promptSuffix: 'clean composition, suitable for blog cover, professional',
        recommendedSize: '1024x768',
    },
    {
        id: 'tech-illustration',
        name: '技术插图',
        promptSuffix: 'technical diagram, clean lines, educational',
        recommendedSize: '1024x1024',
    },
    {
        id: 'abstract-tech',
        name: '抽象科技',
        promptSuffix: 'abstract technology, geometric shapes, gradient, modern',
        recommendedSize: '1024x1024',
    },
    {
        id: 'nature',
        name: '自然风光',
        promptSuffix: 'landscape photography, natural lighting, high resolution',
        recommendedSize: '1024x768',
    },
    {
        id: 'minimalist',
        name: '极简主义',
        promptSuffix: 'minimalist, clean, simple, plenty of negative space',
        recommendedSize: '1024x1024',
    },
]
```

## 8. 测试策略

### 8.1 单元测试

```typescript
// tests/unit/services/ai/image/gemini.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GeminiImageProvider } from '@/services/ai/image/gemini'

describe('GeminiImageProvider', () => {
    const provider = new GeminiImageProvider()

    it('should estimate cost correctly', async () => {
        const cost = await provider.estimateCost({
            prompt: 'test',
            size: '1024x1024',
            count: 2,
        })
        expect(cost).toBe(0.070)  // 0.035 * 2
    })

    it('should parse aspect ratios correctly', () => {
        // 通过反射测试私有方法
        const ratio = (provider as any).parseAspectRatio('1024x768')
        expect(ratio).toBe('4:3')
    })
})
```

### 8.2 集成测试

```typescript
// tests/integration/api/ai/images.test.ts
import { describe, it, expect } from 'vitest'
import { $fetch } from 'ofetch'
import { setupTestServer } from '../helpers'

describe('AI Image Generation API', () => {
    setupTestServer()

    it('should return available providers', async () => {
        const response = await $fetch('/api/ai/images/providers')
        expect(response.available).toBeInstanceOf(Array)
    })

    it('should create generation task', async () => {
        const response = await $fetch('/api/ai/images/generate', {
            method: 'POST',
            body: {
                provider: 'doubao',
                prompt: 'A beautiful landscape',
            },
        })
        expect(response.taskId).toBeDefined()
    })
})
```

## 9. 环境变量汇总

```env
# ========== AI Image Providers ==========

# Doubao (豆包) - 默认
DOUBAO_API_KEY=
DOUBAO_IMAGE_MODEL=

# Gemini 2 Pro Image
GEMINI_API_KEY=
GEMINI_IMAGE_MODEL=imagen-3.0-generate-001
GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com

# Stable Diffusion (本地)
SD_API_ENDPOINT=http://localhost:7860
SD_API_KEY=

# OpenAI DALL-E 3
OPENAI_API_KEY=

# 通用设置
DEFAULT_IMAGE_PROVIDER=doubao
IMAGE_STORAGE_PATH=/uploads/ai-images
IMAGE_MAX_GENERATION_COUNT=4
```

## 10. 实现路线图

### Phase 1: Gemini 2 Pro Image
- [ ] 实现 GeminiImageProvider
- [ ] 集成到驱动工厂
- [ ] 添加单元测试
- [ ] 前端 UI 支持

### Phase 2: Stable Diffusion
- [ ] 实现 StableDiffusionProvider
- [ ] 支持 txt2img 和 img2img
- [ ] 添加参数高级配置（采样器、CFG 等）
- [ ] 本地部署文档

### Phase 3: 高级特性
- [ ] Inpainting 支持
- [ ] ControlNet 集成
- [ ] 批量生成优化
- [ ] 图像历史记录
