export interface MomeiApiConfig {
    apiUrl: string
    apiKey: string
    enableDangerousTools: boolean
}

export function loadConfig(): MomeiApiConfig {
    return {
        apiUrl: process.env.MOMEI_API_URL || 'http://localhost:3000',
        apiKey: process.env.MOMEI_API_KEY || '',
        enableDangerousTools: process.env.MOMEI_ENABLE_DANGEROUS_TOOLS === 'true',
    }
}
