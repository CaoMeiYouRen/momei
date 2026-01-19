/**
 * 检测是否为无服务器环境 (Vercel, Netlify, AWS Lambda, Cloudflare Workers 等)
 * @returns boolean
 */
export const isServerlessEnvironment = () => {
    // Vercel
    if (process.env.VERCEL || process.env.VERCEL_ENV) {
        return true
    }
    // Netlify
    if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
        return true
    }
    // AWS Lambda
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
        return true
    }
    // Cloudflare Workers
    if (process.env.CF_PAGES || process.env.CLOUDFLARE_ENV) {
        return true
    }
    // 检查只读文件系统路径（常见的无服务器环境特征）
    if (process.cwd().includes('/var/task') || process.cwd().includes('/tmp')) {
        return true
    }
    return false
}
