export async function probeRemoteAudio(url: string) {
    try {
        const response = await fetch(url, { method: 'HEAD' })

        if (!response.ok) {
            // Fallback to GET if HEAD is not supported, but limit body size if possible
            // Some CDNs don't support HEAD properly
            const getResponse = await fetch(url, { method: 'GET' })
            if (!getResponse.ok) {
                throw new Error(`Failed to probe URL: ${getResponse.statusText}`)
            }

            const mimeType = getResponse.headers.get('content-type')
            const size = getResponse.headers.get('content-length')

            // We close the body consumption as we only need headers
            await getResponse.body?.cancel()

            return {
                mimeType,
                size: size ? parseInt(size, 10) : null,
            }
        }

        const mimeType = response.headers.get('content-type')
        const size = response.headers.get('content-length')

        return {
            mimeType,
            size: size ? parseInt(size, 10) : null,
        }
    } catch (error: any) {
        throw new Error(`Audio probe failed: ${error.message}`)
    }
}
