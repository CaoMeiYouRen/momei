interface RuntimeCacheEntry {
    value: unknown
    expiresAt: number
}

const runtimeCacheStore = new Map<string, RuntimeCacheEntry>()

export function getRuntimeCache(key: string, now = Date.now()) {
    const entry = runtimeCacheStore.get(key)

    if (!entry) {
        return undefined
    }

    if (entry.expiresAt <= now) {
        runtimeCacheStore.delete(key)
        return undefined
    }

    return entry.value
}

export function setRuntimeCache(key: string, value: unknown, ttlSeconds: number, now = Date.now()) {
    runtimeCacheStore.set(key, {
        value,
        expiresAt: now + ttlSeconds * 1000,
    })
}

export function clearRuntimeCache(key?: string) {
    if (key) {
        runtimeCacheStore.delete(key)
        return
    }

    runtimeCacheStore.clear()
}
