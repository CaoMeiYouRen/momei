# 云端语音识别系统设计文档 (Cloud ASR Hub)

本文档定义了墨梅博客中云端语音识别 (Automatic Speech Recognition, ASR) 功能的高级实现方案。该功能旨在为文章编辑器提供高精度、多模态的语音转文字能力，支持批量转录与实时流式识别。

## 1. 核心目标

- **双模驱动**: 支持 Batch (批量上传) 和 Streaming (实时流式) 两种交互模式
- **高精度**: 解决浏览器 Web Speech API 在专业场景下的识别精度问题
- **语言自适应**: 自动识别语言并根据文章当前语言切换识别引擎
- **AI 联动**: 识别结果可直接调用 LLM 进行润色和格式化
- **安全可控**: 后端统一管理 API Key，支持用户级别的额度控制

## 2. 技术方案

### 2.1 驱动架构矩阵

| 驱动类型 | 交互模式 | API 协议 | 典型厂商 | 使用场景 |
|:---|:---|:---|:---|:---|
| **SiliconFlow** | Batch | HTTP POST (OpenAI 兼容) | SiliconFlow | 上传录音文件进行全文精确转录 |
| **Volcengine** | Streaming | WebSocket + 二进制 | 字节火山/豆包 | 边说边转写，极致实时体验 |

### 2.2 技术对比

#### SiliconFlow (Batch Mode)

**优点**:
- API 简单，与 OpenAI Transcriptions API 兼容
- 支持多语言识别
- 价格相对低廉（国内友好）
- 支持音频预处理（降噪、格式转换）

**缺点**:
- 需等待录音完成后才能开始转写
- 不支持实时反馈

#### Volcengine (Streaming Mode)

**优点**:
- 毫秒级响应，边说边出字
- 支持流式字幕生成
- 可在识别过程中实时打断

**缺点**:
- 实现复杂度较高（WebSocket + 二进制协议）
- 需维护长连接状态

## 3. 数据库设计

### 3.1 ASR 配额表 (`ASRQuota`)

记录用户的语音识别使用额度：

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| `id` | `uuid` | 主键 |
| `userId` | `uuid` | 用户 ID |
| `provider` | `varchar(50)` | 提供者 (siliconflow, volcengine) |
| `periodType` | `varchar(20)` | 额度周期 (daily, monthly, total) |
| `usedSeconds` | `integer` | 已使用秒数 |
| `maxSeconds` | `integer` | 最大允许秒数 |
| `resetAt` | `datetime` | 重置时间 |

### 3.2 ASR 使用记录

ASR 的使用记录已整合进统一个 AI 任务追踪表 `AITask` 中。当 `type` 为 `transcription` 时记录 ASR 任务：

| 字段 | 类型 | 说明 |
|:---|:---|:---|
| `id` | `uuid` | 主键 |
| `userId` | `uuid` | 用户 ID |
| `type` | `varchar(50)` | 任务类型 (transcription) |
| `provider` | `varchar(50)` | 提供者 |
| `model` | `varchar(100)` | 使用的模型 |
| `status` | `varchar(20)` | 状态 |
| `payload` | `text` | 原始参数 (JSON) |
| `result` | `text` | 识别文本 (JSON) |
| `audioDuration` | `integer` | 音频时长（秒） |
| `audioSize` | `integer` | 音频大小（字节） |
| `textLength` | `integer` | 识别文本长度 |
| `language` | `varchar(10)` | 识别语言 |
| `actualCost` | `decimal` | 实际成本 |
| `createdAt` | `datetime` | 创建时间 |

## 4. API 设计

### 4.1 Batch 模式接口

```typescript
// POST /api/ai/asr/transcribe
interface TranscribeRequest {
    audioFile: File | Blob
    language?: string  // 自动检测或指定
    provider?: 'siliconflow' | 'openai'  // 默认 siliconflow
    prompt?: string  // 可选的提示词，提升识别准确度
}

interface TranscribeResponse {
    text: string
    language: string
    duration: number
    confidence: number
    usage: {
        audioSeconds: number
        quotaUsed: number
        quotaRemaining: number
    }
}
```

### 4.2 Streaming 模式接口

```typescript
// WS /api/ai/asr/stream
// WebSocket 连接

// 客户端 -> 服务器
interface StreamingMessageClient {
    type: 'start' | 'audio' | 'stop' | 'config'
    config?: {
        language?: string
        sampleRate?: number
        encoding?: 'pcm' | 'opus'
    }
    audio?: ArrayBuffer  // 二进制音频数据
}

// 服务器 -> 客户端
interface StreamingMessageServer {
    type: 'started' | 'transcript' | 'error' | 'stopped'
    transcript?: {
        text: string
        isFinal: boolean  // 是否为最终结果
        confidence: number
        timestamp: number
    }
    error?: string
}
```

### 4.3 额度查询接口

```typescript
// GET /api/user/asr/quota
interface QuotaResponse {
    daily: QuotaInfo
    monthly: QuotaInfo
    total: QuotaInfo
}

interface QuotaInfo {
    used: number
    max: number
    remaining: number
    resetAt: Date
}
```

## 5. 前端实现

### 5.1 录音管理器

```typescript
// composables/use-asr-recorder.ts
export function useASRRecorder() {
    const isRecording = ref(false)
    const mediaRecorder = ref<MediaRecorder | null>(null)
    const audioChunks = ref<Blob[]>([])

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                },
            })

            mediaRecorder.value = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000,
            })

            mediaRecorder.value.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.value.push(event.data)
                }
            }

            mediaRecorder.value.start(1000) // 每秒一次数据块
            isRecording.value = true
        } catch (error) {
            console.error('Failed to start recording:', error)
            throw error
        }
    }

    function stopRecording(): Blob {
        if (mediaRecorder.value) {
            mediaRecorder.value.stop()
            mediaRecorder.value.stream.getTracks().forEach(track => track.stop())
        }
        isRecording.value = false
        return new Blob(audioChunks.value, { type: 'audio/webm' })
    }

    return { isRecording, startRecording, stopRecording }
}
```

### 5.2 Batch 转录组件

```vue
<template>
    <div class="asr-batch-panel">
        <Button
            :label="isRecording ? $t('voice.stop') : $t('voice.start')"
            :icon="isRecording ? 'pi pi-stop' : 'pi pi-microphone'"
            :severity="isRecording ? 'danger' : 'primary'"
            @click="toggleRecording"
        />

        <div v-if="isRecording" class="recording-indicator">
            <i class="pi pi-spin pi-spinner" />
            <span>{{ formatDuration(recordingDuration) }}</span>
            <WaveformVisualizer :stream="audioStream" />
        </div>

        <div v-if="!isRecording && audioBlob" class="transcribe-actions">
            <Button
                :label="$t('voice.transcribe')"
                icon="pi pi-file-edit"
                :loading="isTranscribing"
                @click="transcribe"
            />
            <Button
                :label="$t('voice.aiPolish')"
                icon="pi pi-pencil"
                severity="secondary"
                :disabled="!transcriptText"
                @click="aiPolish"
            />
        </div>

        <div v-if="transcriptText" class="transcript-result">
            <Panel :header="$t('voice.result')">
                <textarea
                    v-model="transcriptText"
                    rows="10"
                />
                <template #footer>
                    <Button
                        :label="$t('voice.insertToEditor')"
                        icon="pi pi-check"
                        @click="insertToEditor"
                    />
                </template>
            </Panel>
        </div>
    </div>
</template>

<script setup lang="ts">
const { isRecording, startRecording, stopRecording } = useASRRecorder()
const recordingDuration = ref(0)
const audioBlob = ref<Blob | null>(null)
const transcriptText = ref('')
const isTranscribing = ref(false)

let timer: number | null = null

async function toggleRecording() {
    if (!isRecording.value) {
        await startRecording()
        timer = setInterval(() => {
            recordingDuration.value++
        }, 1000) as unknown as number
    } else {
        audioBlob.value = stopRecording()
        if (timer) clearInterval(timer)
    }
}

async function transcribe() {
    if (!audioBlob.value) return

    isTranscribing.value = true
    try {
        const formData = new FormData()
        formData.append('audioFile', audioBlob.value, 'recording.webm')
        formData.append('language', currentLocale.value)

        const result = await $fetch<TranscribeResponse>('/api/ai/asr/transcribe', {
            method: 'POST',
            body: formData,
        })

        transcriptText.value = result.text

        // 显示额度使用情况
        toast.add({
            severity: 'info',
            summary: '识别成功',
            detail: `已使用 ${result.usage.audioSeconds} 秒，剩余 ${result.usage.quotaRemaining} 秒`,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: '识别失败',
            detail: error.message,
        })
    } finally {
        isTranscribing.value = false
    }
}

async function aiPolish() {
    if (!transcriptText.value) return

    try {
        const polished = await $fetch('/api/ai/polish', {
            method: 'POST',
            body: {
                text: transcriptText.value,
                context: 'blog_post',
                language: currentLocale.value,
            },
        })

        transcriptText.value = polished.text
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'AI 润色失败',
            detail: error.message,
        })
    }
}

function insertToEditor() {
    // 将转录文本插入到编辑器光标位置
    editor.value?.insertText(transcriptText.value)
}
</script>
```

### 5.3 Streaming 模式组件

```vue
<template>
    <div class="asr-streaming-panel">
        <Button
            :label="isConnected ? $t('voice.disconnect') : $t('voice.connect')"
            :icon="isConnected ? 'pi pi-phone' : 'pi pi-phone-slash'"
            :severity="isConnected ? 'danger' : 'success'"
            @click="toggleConnection"
        />

        <div v-if="isConnected && !isStreaming" class="stream-config">
            <Dropdown
                v-model="config.language"
                :options="languageOptions"
                optionLabel="name"
                optionValue="code"
            />
            <Button
                label="开始识别"
                icon="pi pi-microphone"
                @click="startStreaming"
            />
        </div>

        <div v-if="isStreaming" class="streaming-status">
            <div class="visualizer">
                <AudioVisualizer :is-active="true" />
            </div>
            <div class="realtime-transcript">
                <p>{{ currentTranscript }}</p>
                <p class="interim">{{ interimTranscript }}</p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const isConnected = ref(false)
const isStreaming = ref(false)
const currentTranscript = ref('')
const interimTranscript = ref('')
let ws: WebSocket | null = null
let recognitionStream: MediaRecorder | null = null

const config = reactive({
    language: 'zh-CN',
    sampleRate: 16000,
    encoding: 'opus' as const,
})

async function toggleConnection() {
    if (isConnected.value) {
        disconnect()
    } else {
        await connect()
    }
}

async function connect() {
    ws = new WebSocket('/api/ai/asr/stream')

    ws.onopen = () => {
        isConnected.value = true
        // 发送配置
        ws!.send(JSON.stringify({
            type: 'config',
            config,
        }))
    }

    ws.onmessage = (event) => {
        const message: StreamingMessageServer = JSON.parse(event.data)

        switch (message.type) {
            case 'started':
                isStreaming.value = true
                break
            case 'transcript':
                if (message.transcript!.isFinal) {
                    currentTranscript.value += message.transcript!.text
                } else {
                    interimTranscript.value = message.transcript!.text
                }
                break
            case 'error':
                toast.add({
                    severity: 'error',
                    summary: '识别错误',
                    detail: message.error,
                })
                break
            case 'stopped':
                isStreaming.value = false
                break
        }
    }

    ws.onerror = (error) => {
        toast.add({
            severity: 'error',
            summary: '连接错误',
            detail: 'WebSocket 连接失败',
        })
    }
}

async function startStreaming() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        recognitionStream = new MediaRecorder(stream)

        recognitionStream.ondataavailable = async (event) => {
            if (event.data.size > 0 && ws?.readyState === WebSocket.OPEN) {
                const arrayBuffer = await event.data.arrayBuffer()
                ws.send(JSON.stringify({
                    type: 'audio',
                    audio: arrayBuffer,
                }))
            }
        }

        recognitionStream.start(250) // 每 250ms 发送一次

        ws!.send(JSON.stringify({ type: 'start' }))
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: '无法访问麦克风',
            detail: error.message,
        })
    }
}

function disconnect() {
    recognitionStream?.stream.getTracks().forEach(track => track.stop())
    ws?.close()
    isConnected.value = false
    isStreaming.value = false
    currentTranscript.value = ''
    interimTranscript.value = ''
}

onUnmounted(() => {
    disconnect()
})
</script>
```

## 6. 后端实现

### 6.1 SiliconFlow Batch 实现

```typescript
// server/services/asr/siliconflow.ts
export class SiliconFlowASRProvider {
    async transcribe(
        audioFile: Blob,
        options: TranscribeOptions
    ): Promise<TranscribeResult> {
        const formData = new FormData()
        formData.append('file', audioFile)
        formData.append('model', 'whisper-1')
        if (options.language) {
            formData.append('language', options.language)
        }
        if (options.prompt) {
            formData.append('prompt', options.prompt)
        }

        const response = await fetch('https://api.siliconflow.cn/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
            },
            body: formData,
        })

        if (!response.ok) {
            throw new Error(`SiliconFlow API error: ${response.statusText}`)
        }

        const data = await response.json()
        return {
            text: data.text,
            language: data.language,
            duration: data.duration,
            confidence: 0.95, // Whisper 不提供置信度，使用默认值
        }
    }

    estimateCost(audioDuration: number): number {
        // SiliconFlow Whisper 定价: ¥0.25/小时
        return (audioDuration / 3600) * 0.25
    }
}
```

### 6.2 Volcengine Streaming 实现

```typescript
// server/services/asr/volcengine.ts
import { WebSocket } from 'ws'

export class VolcengineASRProvider {
    private connections = new Map<string, WebSocket>()

    async createStream(userId: string): Promise<string> {
        const streamId = randomUUID()

        // 连接到火山引擎 WebSocket 服务
        const ws = new WebSocket(`wss://openspeech.bytedance.com/api/v2/asr`, {
            headers: {
                'Authorization': `Bearer ${process.env.VOLCENGINE_API_KEY}`,
            },
        })

        ws.on('message', (data) => {
            const message = JSON.parse(data.toString())
            this.handleMessage(streamId, message)
        })

        this.connections.set(streamId, ws)
        return streamId
    }

    async sendAudio(streamId: string, audioData: Buffer): Promise<void> {
        const ws = this.connections.get(streamId)
        if (!ws) throw new Error('Stream not found')

        // 发送二进制音频数据
        ws.send(Buffer.from(JSON.stringify({
            type: 'audio',
            data: audioData.toString('base64'),
        })))
    }

    async closeStream(streamId: string): Promise<void> {
        const ws = this.connections.get(streamId)
        if (ws) {
            ws.close()
            this.connections.delete(streamId)
        }
    }

    private handleMessage(streamId: string, message: any) {
        // 处理识别结果，通过 SSE 或回调向前端推送
        // 具体实现取决于火山引擎的协议
    }
}
```

### 6.3 额度管理服务

```typescript
// server/services/asr/quota.ts
export class ASRQuotaService {
    async checkQuota(
        userId: string,
        provider: string,
        duration: number
    ): Promise<boolean> {
        const quota = await asrQuotaRepo.findOne({
            where: { userId, provider, periodType: 'daily' },
        })

        if (!quota) {
            // 创建默认额度
            await this.createDefaultQuota(userId, provider)
            return true
        }

        // 检查是否需要重置
        if (new Date() > quota.resetAt) {
            await this.resetQuota(quota)
        }

        return quota.usedSeconds + duration <= quota.maxSeconds
    }

    async recordUsage(
        userId: string,
        provider: string,
        mode: 'batch' | 'streaming',
        audioDuration: number,
        audioSize: number,
        textLength: number,
        language: string
    ): Promise<void> {
        // 更新额度
        await asrQuotaRepo.increment(
            { userId, provider, periodType: 'daily' },
            'usedSeconds',
            audioDuration
        )

        // 记录任务 (已整合至 AITask)
        await aiTaskRepo.save({
            userId,
            category: 'asr',
            type: 'transcription',
            provider,
            status: 'completed',
            audioDuration,
            audioSize,
            textLength,
            language,
            actualCost: this.estimateCost(provider, audioDuration),
        })
    }

    private estimateCost(provider: string, duration: number): number {
        switch (provider) {
            case 'siliconflow':
                return (duration / 3600) * 0.25
            case 'volcengine':
                return (duration / 3600) * 0.5
            default:
                return 0
        }
    }
}
```

## 7. AI 润色集成

识别后的文本可以直接调用 AI 进行润色：

```typescript
// server/services/asr/polisher.ts
export async function polishTranscript(
    text: string,
    context: 'blog_post' | 'outline' | 'conversation',
    language: string
): Promise<string> {
    const prompt = getPolishPrompt(context, language)

    const response = await aiService.generate({
        model: 'gpt-4',
        messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: text },
        ],
        temperature: 0.7,
    })

    return response.content
}

function getPolishPrompt(context: string, language: string): string {
    const prompts: Record<string, string> = {
        'zh-CN': `你是一位专业的博客编辑。请将以下口语化的录音转写文本润色为规范的博客文章片段。
要求：
1. 保持原意不变
2. 使用正式、流畅的书面语
3. 添加适当的 Markdown 格式（标题、列表等）
4. 保持技术术语的准确性

直接输出润色后的文本，不需要任何解释。`,

        'en-US': `You are a professional blog editor. Please polish the following transcribed text into a well-written blog post excerpt.
Requirements:
1. Maintain the original meaning
2. Use formal, fluent written language
3. Add appropriate Markdown formatting (headings, lists, etc.)
4. Keep technical terms accurate

Output only the polished text without any explanation.`,
    }

    return prompts[language] || prompts['en-US']
}
```

## 8. 环境变量配置

```env
# SiliconFlow
SILICONFLOW_API_KEY=

# Volcengine
VOLCENGINE_API_KEY=
VOLCENGINE_APP_ID=

# 默认配置
ASR_DEFAULT_PROVIDER=siliconflow
ASR_DEFAULT_LANGUAGE=zh-CN

# 用户额度
ASR_DAILY_QUOTA_SECONDS=3600  # 1小时/天
ASR_MONTHLY_QUOTA_SECONDS=21600  # 6小时/月
```

## 9. UI/UX 设计

### 9.1 编辑器工具栏集成

```vue
<template>
    <div class="editor-toolbar">
        <!-- 其他工具按钮 -->
        <SplitButton
            label="语音"
            icon="pi pi-microphone"
            :model="voiceOptions"
            @click="defaultVoiceAction"
        >
            <template #menuitem="{ item }">
                <button @click="item.action">
                    <i :class="item.icon" />
                    <span>{{ item.label }}</span>
                </button>
            </template>
        </SplitButton>
    </div>
</template>

<script setup lang="ts">
const voiceOptions = [
    {
        label: '快速录音 (浏览器)',
        icon: 'pi pi-bolt',
        action: () => useBrowserSpeech(),
    },
    {
        label: '高精度转录 (上传)',
        icon: 'pi pi-upload',
        action: () => showBatchDialog.value = true,
    },
    {
        label: '实时识别',
        icon: 'pi pi-video',
        action: () => showStreamingDialog.value = true,
    },
]
</script>
```

### 9.2 波形可视化组件

```vue
<template>
    <canvas ref="canvas" class="waveform-visualizer" />
</template>

<script setup lang="ts">
const props = defineProps<{
    stream: MediaStream | null
}>()

const canvas = ref<HTMLCanvasElement>()
const ctx = ref<CanvasRenderingContext2D>()
const audioContext = ref<AudioContext>()
const analyser = ref<AnalyserNode>()
const dataArray = ref<Uint8Array>()
let animationId: number

onMounted(() => {
    if (!canvas.value) return
    ctx.value = canvas.value.getContext('2d')!

    if (props.stream) {
        setupAudioAnalysis()
        draw()
    }
})

function setupAudioAnalysis() {
    audioContext.value = new AudioContext()
    const source = audioContext.value.createMediaStreamSource(props.stream!)
    analyser.value = audioContext.value.createAnalyser()
    analyser.value.fftSize = 256
    source.connect(analyser.value)

    const bufferLength = analyser.value.frequencyBinCount
    dataArray.value = new Uint8Array(bufferLength)
}

function draw() {
    animationId = requestAnimationFrame(draw)

    if (!analyser.value || !ctx.value || !canvas.value) return

    analyser.value.getByteFrequencyData(dataArray.value)

    const width = canvas.value.width
    const height = canvas.value.height

    ctx.value.clearRect(0, 0, width, height)

    const barWidth = (width / dataArray.value.length) * 2.5
    let barX = 0

    for (let i = 0; i < dataArray.value.length; i++) {
        const barHeight = (dataArray.value[i] / 255) * height

        // 渐变色
        const gradient = ctx.value!.createLinearGradient(0, height, 0, height - barHeight)
        gradient.addColorStop(0, 'rgb(59, 130, 246)')
        gradient.addColorStop(1, 'rgb(147, 51, 234)')

        ctx.value!.fillStyle = gradient
        ctx.value!.fillRect(barX, height - barHeight, barWidth, barHeight)

        barX += barWidth + 1
    }
}

onUnmounted(() => {
    cancelAnimationFrame(animationId)
    audioContext.value?.close()
})
</script>

<style scoped lang="scss">
.waveform-visualizer {
    width: 100%;
    height: 60px;
    background: var(--surface-ground);
    border-radius: 8px;
}
</style>
```

## 10. 技术调研结果

### 10.1 主流 ASR 服务对比

| 特性 | SiliconFlow | Volcengine | 阿里云 | 腾讯云 |
|:---|:---|:---|:---|:---|
| **API 简单度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **实时支持** | ❌ | ✅ | ✅ | ✅ |
| **国内访问** | ✅ | ✅ | ✅ | ✅ |
| **识别精度** | 高 | 很高 | 高 | 高 |
| **价格** | ¥0.25/小时 | ¥0.5/小时 | 按量计费 | 按量计费 |
| **多语言** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

**建议**:
- 首选 SiliconFlow 作为 Batch 模式提供者（API 简单、价格低）
- Volcengine 作为 Streaming 模式提供者（实时性强）

### 10.2 音频编码选择

| 编码 | 比特率 | 质量 | 兼容性 | 建议 |
|:---|:---|:---|:---|:---|
| **Opus** | 16-64 kbps | 很好 | 好 | Streaming 优先 |
| **PCM** | 128-256 kbps | 好 | 很好 | Batch 优先 |
| **WebM** | 64-128 kbps | 好 | 好 | 浏览器录制默认 |

**建议**:
- Streaming: Opus 16kbps (低延迟)
- Batch: PCM 16kHz 16bit (高精度)

## 11. 实现路线图

### Phase 1: Batch 模式
- [ ] 实现 SiliconFlow 集成
- [ ] 实现额度管理系统
- [ ] 前端录音组件
- [ ] AI 润色集成

### Phase 2: Streaming 模式
- [ ] 实现 Volcengine WebSocket 集成
- [ ] 前端实时识别组件
- [ ] 波形可视化

### Phase 3: 高级特性
- [ ] 多语言自动检测
- [ ] 音频预处理（降噪）
- [ ] 说话人分离（Diarization）
- [ ] 标点时间戳生成
