import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const STATIC_MODULES = ['common', 'components', 'feed']

const PAGE_NAMESPACE_GROUPS = {
    public: ['submit', 'posts', 'error', 'user_agreement', 'privacy_policy', 'about', 'categories_index', 'tags_index', 'archives'],
    settings: ['settings'],
    auth: ['login', 'register', 'forgot_password', 'reset_password'],
    admin: ['admin'],
}

const TOP_LEVEL_MODULES = ['home', 'demo', 'installation', 'legal']
const LOCALES = ['zh-CN', 'en-US']

function pickObject(source, keys) {
    return keys.reduce((result, key) => {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            result[key] = source[key]
        }
        return result
    }, {})
}

async function loadPagesSource(localeDir) {
    const pagesPath = join(localeDir, 'pages.json')

    if (existsSync(pagesPath)) {
        return JSON.parse(await readFile(pagesPath, 'utf8'))
    }

    const source = { pages: {} }

    for (const [moduleName, namespaceKeys] of Object.entries(PAGE_NAMESPACE_GROUPS)) {
        const modulePath = join(localeDir, `${moduleName}.json`)
        if (!existsSync(modulePath)) {
            continue
        }

        const moduleData = JSON.parse(await readFile(modulePath, 'utf8'))
        Object.assign(source.pages, pickObject(moduleData.pages || {}, namespaceKeys))
    }

    for (const moduleName of TOP_LEVEL_MODULES) {
        const modulePath = join(localeDir, `${moduleName}.json`)
        if (!existsSync(modulePath)) {
            continue
        }

        const moduleData = JSON.parse(await readFile(modulePath, 'utf8'))
        if (Object.prototype.hasOwnProperty.call(moduleData, moduleName)) {
            source[moduleName] = moduleData[moduleName]
        }
    }

    return source
}

async function main() {
    const root = process.cwd()
    const localeRoot = resolve(root, 'i18n', 'locales')

    for (const localeCode of LOCALES) {
        const localeDir = join(localeRoot, localeCode)
        const pagesPath = join(localeDir, 'pages.json')
        const pagesModule = await loadPagesSource(localeDir)

        for (const moduleName of STATIC_MODULES) {
            const sourcePath = join(localeDir, `${moduleName}.json`)
            const outputPath = join(localeDir, `${moduleName}.json`)
            const raw = await readFile(sourcePath, 'utf8')
            await mkdir(dirname(outputPath), { recursive: true })
            await writeFile(outputPath, `${JSON.stringify(JSON.parse(raw), null, 2)}\n`, 'utf8')
        }

        for (const [moduleName, namespaceKeys] of Object.entries(PAGE_NAMESPACE_GROUPS)) {
            const outputPath = join(localeDir, `${moduleName}.json`)
            const output = {
                pages: pickObject(pagesModule.pages || {}, namespaceKeys),
            }

            await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
        }

        for (const moduleName of TOP_LEVEL_MODULES) {
            const outputPath = join(localeDir, `${moduleName}.json`)
            const output = Object.prototype.hasOwnProperty.call(pagesModule, moduleName)
                ? { [moduleName]: pagesModule[moduleName] }
                : {}

            await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
        }

        await rm(pagesPath, { force: true })
    }
}

main().catch((error) => {
    console.error('Failed to split locale files:', error)
    process.exitCode = 1
})
