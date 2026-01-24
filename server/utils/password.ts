import { scryptHash, scryptVerify } from './crypto'

/**
 * Hash a password using scrypt
 * @param password Plaintext password
 * @returns Hashed password in format "salt:hash"
 */
export const hashPassword = (password: string): string => scryptHash(password)

/**
 * Verify a password against a hash
 * @param password Plaintext password
 * @param storedHash Hashed password in format "salt:hash"
 * @returns boolean
 */
export const verifyPassword = (password: string, storedHash: string): boolean => scryptVerify(password, storedHash)
