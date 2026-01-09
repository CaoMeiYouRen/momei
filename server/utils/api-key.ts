import { randomBytes, scryptSync, timingSafeEqual } from 'crypto'

const API_KEY_PREFIX = 'momei_sk_'

export const generateApiKey = (prefix = API_KEY_PREFIX, length = 32) => {
    const random = randomBytes(length).toString('hex')
    return `${prefix}${random}`
}

export const hashApiKey = (key: string) => {
    // Generate a random salt
    const salt = randomBytes(16).toString('hex')
    // Scrypt with 64 bytes key length
    const derivedKey = scryptSync(key, salt, 64).toString('hex')
    // Store as salt:hash
    return `${salt}:${derivedKey}`
}

export const verifyApiKey = (key: string, storedHash: string) => {
    if (!storedHash.includes(':')) {
        return false
    }

    const [salt, hash] = storedHash.split(':')
    // Re-compute hash with extracted salt
    const derivedKey = scryptSync(key, salt, 64).toString('hex')

    // Constant-time comparison
    const keyBuffer = Buffer.from(derivedKey, 'hex')
    const hashBuffer = Buffer.from(hash, 'hex')

    // Ensure buffers are of equal length before calling timingSafeEqual
    if (keyBuffer.length !== hashBuffer.length) {
        return false
    }

    return timingSafeEqual(keyBuffer, hashBuffer)
}

export const maskApiKey = (key: string) => {
    if (key.length <= 8) {
        return '*'.repeat(key.length)
    }
    return `${key.slice(0, 4)}...${key.slice(-4)}`
}
