class PcmCaptureProcessor extends AudioWorkletProcessor {
    process(inputs) {
        const inputChannels = inputs[0]
        const firstChannel = inputChannels?.[0]

        if (firstChannel) {
            this.port.postMessage(firstChannel.slice(0))
        }

        return true
    }
}

registerProcessor('pcm-capture-processor', PcmCaptureProcessor)
