import { pipeline, env, type PipelineType } from '@huggingface/transformers'

// Skip local model check
env.allowLocalModels = false

// Use the Singleton pattern to enable lazy construction of the pipeline.
class TranscriptionPipeline {
    static task: PipelineType = 'automatic-speech-recognition'
    static model: string | null = null
    static instance: any = null

    static async getInstance(modelName: string, progress_callback: any = null) {
        if (this.instance !== null && this.model === modelName) {
            return await this.instance
        }

        this.model = modelName
        const isTiny = modelName.includes('tiny')

        // If switching models, we should probably clear the old instance to save memory
        if (this.instance !== null) {
            // Note: transformers.js instance disposal might vary
            this.instance = null
        }

        this.instance = pipeline(this.task, this.model, {
            progress_callback,
            device: 'webgpu',
            dtype: isTiny ? 'q4' : 'auto',
        }).catch(async (err) => {
            console.warn('WebGPU failed, falling back to WASM', err)
            return await pipeline(this.task, this.model!, {
                progress_callback,
                device: 'wasm',
                dtype: isTiny ? 'q4' : 'auto',
            })
        })

        return await this.instance
    }
}

// Listen for messages from the main thread
self.onmessage = async (event: MessageEvent) => {
    const { type, audio, language, hfProxy, model, isFinal } = event.data

    if (type === 'load') {
        try {
            if (hfProxy) {
                env.remoteHost = hfProxy
                console.info('[Worker] Using HF Proxy:', env.remoteHost)
            }

            const modelName = model || 'onnx-community/whisper-tiny'

            console.info(`[Worker] Loading model: ${modelName}`)
            await TranscriptionPipeline.getInstance(modelName, (data: any) => {
                self.postMessage({ type: 'progress', data, model: modelName })
            })

            console.info(`[Worker] Model ${modelName} is ready`)
            self.postMessage({ type: 'ready', model: modelName })
        } catch (error: any) {
            console.error('[Worker] Load error:', error)
            self.postMessage({ type: 'error', data: error.message })
        }
    } else if (type === 'transcribe') {
        try {
            const modelName = model || 'onnx-community/whisper-tiny'
            const transcriber = await TranscriptionPipeline.getInstance(modelName)
            const output = await transcriber(audio, {
                language,
                task: 'transcribe',
                chunk_length_s: 30,
                stride_length_s: 5,
            })
            self.postMessage({ type: 'result', data: output, isFinal })
        } catch (error: any) {
            self.postMessage({ type: 'error', data: error.message, isFinal })
        }
    }
}
