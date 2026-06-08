import { createError } from 'h3'

interface RequestTTSAudioStreamOptions {
    endpoint: string
    apiKey: string
    payload: Record<string, unknown>
    resolveErrorMessage: (errorData: Record<string, unknown>, fallback: string) => string
    noResponseBodyMessage: string
    requestFailedMessage: string
}

export async function requestTTSAudioStream(options: RequestTTSAudioStreamOptions): Promise<ReadableStream<Uint8Array>> {
    try {
        const response = await fetch(options.endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${options.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(options.payload),
        })

        if (!response.ok) {
            const errorPayload = await response.json().catch(() => ({}))
            const errorData = typeof errorPayload === 'object' && errorPayload !== null
                ? errorPayload as Record<string, unknown>
                : {}
            throw createError({
                statusCode: response.status,
                message: options.resolveErrorMessage(errorData, response.statusText),
            })
        }

        if (!response.body) {
            throw createError({
                statusCode: 500,
                message: options.noResponseBodyMessage,
            })
        }

        return response.body
    } catch (e: unknown) {
        const error = e as { message?: string, statusCode?: number }
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || options.requestFailedMessage,
        })
    }
}
