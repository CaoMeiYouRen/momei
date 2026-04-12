interface RuntimeCacheEntry {
    value: unknown
    expiresAt: number
}

// 进程内短 TTL 缓存：仅用于削峰和热点复用，不保证跨实例一致性。
const runtimeCacheStore = new Map<string, RuntimeCacheEntry>()

export function getRuntimeCache(key: string, now = Date.now()) {
    const entry = runtimeCacheStore.get(key)

    if (!entry) {
        return undefined
    }

    // 读取时惰性淘汰过期项，避免额外定时器开销。
    if (entry.expiresAt <= now) {
        runtimeCacheStore.delete(key)
        return undefined
    }

    return entry.value
}

export function setRuntimeCache(key: string, value: unknown, ttlSeconds: number, now = Date.now()) {
    // ttlSeconds 由调用方按接口热度决定；该层不做业务语义判断。
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
