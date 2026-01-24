import { randomBytes } from 'crypto'
import { scryptHash, scryptVerify } from './crypto'

const API_KEY_PREFIX = 'momei_sk_'

export const generateApiKey = (prefix = API_KEY_PREFIX, length = 32) => {
    const random = randomBytes(length).toString('hex')
    return `${prefix}${random}`
}

export const hashApiKey = (key: string) => scryptHash(key)

export const verifyApiKey = (key: string, storedHash: string) => scryptVerify(key, storedHash)

export const maskApiKey = (key: string) => {
    if (key.length <= 8) {
        return '*'.repeat(key.length)
    }
    return `${key.slice(0, 4)}...${key.slice(-4)}`
}
