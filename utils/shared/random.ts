/**
 * 生成加密安全的随机字符串
 * 使用 Node.js 的 crypto.randomBytes 而不是 Math.random()
 * @param length 字符串长度
 * @returns 随机字符串
 */
export function generateRandomString(length: number): string {
    // 仅在服务端使用 crypto.randomBytes
    if (import.meta.server) {
        const crypto = require('node:crypto')
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        const randomBytes = crypto.randomBytes(length)
        let result = ''
        for (let i = 0; i < length; i++) {
            // 使用加密安全的随机字节来选择字符
            result += characters[randomBytes[i] % characters.length]
        }
        return result
    }

    // 客户端回退到 Math.random()（客户端不应用于生成安全敏感的值）
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        result += characters[randomIndex]
    }
    return result
}
