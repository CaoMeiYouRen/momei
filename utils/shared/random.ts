/**
 * 随机字符串生成工具
 */

/**
 * 生成加密安全的随机字符串
 * 使用 Web Crypto API (globalThis.crypto) 以支持跨环境 (服务端和客户端) 运行
 *
 * @param length 字符串长度
 * @returns 随机字符串
 */
export function generateRandomString(length: number): string {
    if (length <= 0) {
        return ''
    }
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const bytes = new Uint8Array(length)
    globalThis.crypto.getRandomValues(bytes)
    let result = ''
    for (let i = 0; i < length; i++) {
        // 使用加密安全的随机字节来选择字符
        result += characters[bytes[i]! % characters.length]
    }
    return result
}

/**
 * 生成不安全的随机字符串 (使用 Math.random)
 * 仅用于非安全敏感的场景,如临时 ID、测试数据等
 *
 * @param length 字符串长度
 * @returns 随机字符串
 */
export function generateInsecureRandomString(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length)
        result += characters[randomIndex]
    }
    return result
}
