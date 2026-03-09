import { parse } from 'better-bytes'

export interface UploadSizeSettingResolution {
    bytes: number
    text: string
}

export function resolveUploadSizeSetting(value: string | null | undefined, fallbackMegabytes: number): UploadSizeSettingResolution {
    const fallbackText = `${fallbackMegabytes}MB`
    const fallbackBytes = fallbackMegabytes * 1024 * 1024
    const normalizedValue = value?.trim()

    if (!normalizedValue) {
        return {
            bytes: fallbackBytes,
            text: fallbackText,
        }
    }

    const numericMegabytes = Number(normalizedValue)
    if (Number.isFinite(numericMegabytes) && numericMegabytes > 0) {
        return {
            bytes: numericMegabytes * 1024 * 1024,
            text: `${normalizedValue}MB`,
        }
    }

    try {
        const parsedBytes = Number(parse(normalizedValue))

        if (Number.isFinite(parsedBytes) && parsedBytes > 0) {
            return {
                bytes: parsedBytes,
                text: normalizedValue,
            }
        }
    } catch {
        // Ignore invalid values and fall back to the default limit.
    }

    return {
        bytes: fallbackBytes,
        text: fallbackText,
    }
}
