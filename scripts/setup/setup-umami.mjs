import { randomBytes } from 'node:crypto'
import { parseCliOptions } from '../shared/cli.mjs'

const {
    jsonOutput,
    websiteId,
    scriptUrl,
    appSecret,
} = parseCliOptions(process.argv, {
    defaults: {
        jsonOutput: false,
        websiteId: '',
        scriptUrl: 'https://analytics.example.com/script.js',
        appSecret: '',
    },
    flags: {
        '--json': { key: 'jsonOutput' },
    },
    values: {
        '--website-id': { key: 'websiteId' },
        '--script-url': { key: 'scriptUrl' },
        '--app-secret': { key: 'appSecret' },
    },
})

const resolvedAppSecret = appSecret.trim() || randomBytes(24).toString('hex')
const analyticsPayload = websiteId.trim()
    ? JSON.stringify({
        websiteId: websiteId.trim(),
        scriptUrl: scriptUrl.trim() || 'https://analytics.example.com/script.js',
    })
    : ''

const output = {
    umamiEnvTemplate: {
        UMAMI_CONTAINER_NAME: 'momei-umami',
        UMAMI_DB_CONTAINER_NAME: 'momei-umami-db',
        UMAMI_PORT: '3001',
        UMAMI_POSTGRES_DB: 'umami',
        UMAMI_POSTGRES_USER: 'umami',
        UMAMI_POSTGRES_PASSWORD: 'change-me',
        UMAMI_APP_SECRET: resolvedAppSecret,
        UMAMI_TRACKER_SCRIPT_NAME: 'script.js',
    },
    momeiEnvSuggestion: analyticsPayload
        ? { NUXT_PUBLIC_UMAMI_ANALYTICS: analyticsPayload }
        : {},
    commands: [
        'cp umami.env.example .env.umami',
        'docker compose -f docker-compose.yml -f docker-compose.umami.yml --env-file .env --env-file .env.umami up -d',
    ],
}

if (jsonOutput) {
    console.info(JSON.stringify(output, null, 2))
    process.exit(0)
}

console.info('# Umami Phase 2 setup checklist')
console.info('1) Copy template and adjust credentials:')
console.info('   cp umami.env.example .env.umami')
console.info('')
console.info('2) Recommended .env.umami values:')
for (const [key, value] of Object.entries(output.umamiEnvTemplate)) {
    console.info(`${key}=${value}`)
}
console.info('')

if (analyticsPayload) {
    console.info('3) Add this to your momei .env (or System Settings analytics field):')
    console.info(`NUXT_PUBLIC_UMAMI_ANALYTICS=${analyticsPayload}`)
    console.info('')
}

console.info('4) Start momei + Umami stack:')
console.info('docker compose -f docker-compose.yml -f docker-compose.umami.yml --env-file .env --env-file .env.umami up -d')
console.info('')
console.info('# Optional flags')
console.info('#   --website-id=your-umami-website-id')
console.info('#   --script-url=https://analytics.example.com/script.js')
console.info('#   --app-secret=your-strong-secret')
console.info('#   --json')
