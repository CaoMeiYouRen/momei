import { pipeline, env, type PipelineType } from '@huggingface/transformers'

// Skip local model check
env.allowLocalModels = false

// Use the Singleton pattern to enable lazy construction of the pipeline.
class TranscriptionPipeline {
    static task: PipelineType = 'automatic-speech-recognition'
    static model = 'onnx-community/whisper-tiny'
    static instance: any = null

    static async getInstance(progress_callback: any = null) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, {
                progress_callback,
                device: 'webgpu',
            }).catch(async (err) => {
                console.warn('WebGPU failed, falling back to WASM', err)
                return pipeline(this.task, this.model, {
                    progress_callback,
                    device: 'wasm',
                })
            })
        }
        return this.instance
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event: any) => {
    const { type, audio, language } = event.data

    if (type === 'load') {
        try {
            await TranscriptionPipeline.getInstance((x: any) => {
                self.postMessage({ type: 'progress', data: x })
            })
            self.postMessage({ type: 'ready' })
        } catch (error: any) {
            self.postMessage({ type: 'error', data: error.message })
        }
    } else if (type === 'transcribe') {
        try {
            const transcriber = await TranscriptionPipeline.getInstance()
            const output = await transcriber(audio, {
                language,
                task: 'transcribe',
                chunk_length_s: 30,
                stride_length_s: 5,
            })
            self.postMessage({ type: 'result', data: output })
        } catch (error: any) {
            self.postMessage({ type: 'error', data: error.message })
        }
    }
})
