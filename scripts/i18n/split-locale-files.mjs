import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

const MODULE_GROUPS = {
    common: ['app', 'common', 'error', 'redirect'],
    components: ['components', 'comments'],
    pages: ['pages', 'home', 'demo', 'installation', 'legal'],
    feed: ['feed'],
}

const SOURCE_FILES = ['zh-CN.json', 'en-US.json']

async function main() {
    const root = process.cwd()
    const localeRoot = resolve(root, 'i18n', 'locales')

    for (const sourceFile of SOURCE_FILES) {
        const sourcePath = join(localeRoot, sourceFile)
        const localeCode = sourceFile.replace(/\.json$/u, '')
        const raw = await readFile(sourcePath, 'utf8')
        const messages = JSON.parse(raw)

        for (const [moduleName, namespaces] of Object.entries(MODULE_GROUPS)) {
            const output = {}
            for (const namespace of namespaces) {
                if (Object.prototype.hasOwnProperty.call(messages, namespace)) {
                    output[namespace] = messages[namespace]
                }
            }

            const outputPath = join(localeRoot, localeCode, `${moduleName}.json`)
            await mkdir(dirname(outputPath), { recursive: true })
            await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
        }
    }
}

main().catch((error) => {
    console.error('Failed to split locale files:', error)
    process.exitCode = 1
})
