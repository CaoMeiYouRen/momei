import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * 通用的 Scrypt 哈希加密逻辑
 * @param value 原始字符串
 * @param options 配置项
 * @returns 格式为 "salt:hash" 的字符串
 */
export const scryptHash = (value: string, options: { saltLength?: number, keyLength?: number } = {}): string => {
    const { saltLength = 16, keyLength = 64 } = options
    const salt = randomBytes(saltLength).toString('hex')
    const derivedKey = scryptSync(value, salt, keyLength)
    return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * 通用的 Scrypt 验证逻辑
 * @param value 原始字符串
 * @param storedHash 存储的哈希值 ("salt:hash")
 * @param options 配置项
 * @returns 是否匹配
 */
export const scryptVerify = (value: string, storedHash: string, options: { keyLength?: number } = {}): boolean => {
    const { keyLength = 64 } = options
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) {
        return false
    }

    const derivedKey = scryptSync(value, salt, keyLength)
    const hashBuffer = Buffer.from(hash, 'hex')

    // 长度检查，防御某些环境下的 timingSafeEqual 报错
    if (hashBuffer.length !== derivedKey.length) {
        return false
    }

    return timingSafeEqual(hashBuffer, derivedKey)
}
