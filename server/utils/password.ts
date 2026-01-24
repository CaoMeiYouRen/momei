import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Hash a password using scrypt
 * @param password Plaintext password
 * @returns Hashed password in format "salt:hash"
 */
export const hashPassword = (password: string): string => {
    const salt = randomBytes(16).toString('hex')
    const derivedKey = scryptSync(password, salt, 64)
    return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verify a password against a hash
 * @param password Plaintext password
 * @param storedHash Hashed password in format "salt:hash"
 * @returns boolean
 */
export const verifyPassword = (password: string, storedHash: string): boolean => {
    const [salt, hash] = storedHash.split(':')
    if (!salt || !hash) { return false }

    const derivedKey = scryptSync(password, salt, 64)
    const hashBuffer = Buffer.from(hash, 'hex')

    // Constant-time comparison
    return timingSafeEqual(hashBuffer, derivedKey)
}
