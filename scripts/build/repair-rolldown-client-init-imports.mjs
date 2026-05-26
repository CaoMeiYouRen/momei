import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const INIT_HELPERS = [
    'init_runtime_dom_esm_bundler',
    'init_runtime_core_esm_bundler',
    'init_shared_esm_bundler',
]

const STRIP_ONLY_HELPERS = new Set([
    'init_runtime_core_esm_bundler',
])

function hasHelperImport(content, helperName) {
    const importPattern = new RegExp(
        `import\\s*\\{[^}]*\\b${helperName}\\b[^}]*\\}\\s*from`,
        'm',
    )
    return importPattern.test(content)
}

function findImportBlock(content) {
    return content.match(/^(?:import[^;]+;\s*)+/)
}

function insertImport(content, source, specifiers) {
    const importLine = `import { ${specifiers.join(', ')} } from ${JSON.stringify(source)};`
    const importBlock = findImportBlock(content)

    if (!importBlock) {
        return `${importLine}\n${content}`
    }

    return `${importBlock[0]}${importLine}${content.slice(importBlock[0].length)}`
}

function stripHelperCall(content, helperName) {
    let nextContent = content

    for (const pattern of [
        new RegExp(`\\b${helperName}\\(\\)\\s*,\\s*`, 'g'),
        new RegExp(`\\b${helperName}\\(\\)\\s*;`, 'g'),
    ]) {
        nextContent = nextContent.replace(pattern, '')
    }

    return nextContent
}

async function discoverHelperImports(chunksDir, chunkFiles) {
    const helperImports = new Map()

    for (const fileName of chunkFiles) {
        const filePath = join(chunksDir, fileName)
        const content = await readFile(filePath, 'utf8')
        const importMatches = content.matchAll(/import\s*\{([^}]+)\}\s*from\s*["'](.+?)["'];/g)

        for (const match of importMatches) {
            const specifiers = match[1]
            const source = match[2]

            for (const helperName of INIT_HELPERS) {
                if (helperImports.has(helperName)) {
                    continue
                }

                const helperMatch = specifiers.match(
                    new RegExp(`\\b([A-Za-z_$][\\w$]*)\\s+as\\s+${helperName}\\b`),
                )

                if (helperMatch) {
                    helperImports.set(helperName, {
                        alias: helperMatch[1],
                        source,
                    })
                }
            }

            if (helperImports.size === INIT_HELPERS.length) {
                return helperImports
            }
        }
    }

    return helperImports
}

export async function repairRolldownClientInitImports({
    chunksDirs = [
        fileURLToPath(new URL('../../node_modules/.cache/nuxt/.nuxt/dist/client/_nuxt/', import.meta.url)),
    ],
} = {}) {
    for (const chunksDir of chunksDirs) {
        let chunkFiles = []

        try {
            chunkFiles = (await readdir(chunksDir)).filter((fileName) => fileName.endsWith('.js'))
        } catch (error) {
            if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
                continue
            }
            throw error
        }

        const helperImports = await discoverHelperImports(chunksDir, chunkFiles)
        const patchedFiles = []

        for (const fileName of chunkFiles) {
            const filePath = join(chunksDir, fileName)
            let content = await readFile(filePath, 'utf8')
            const missingHelpers = INIT_HELPERS.filter((helperName) => content.includes(`${helperName}()`) && !hasHelperImport(content, helperName))

            if (!missingHelpers.length) {
                continue
            }

            const importsBySource = new Map()

            for (const helperName of missingHelpers) {
                const helperImport = helperImports.get(helperName)

                if (!helperImport) {
                    if (STRIP_ONLY_HELPERS.has(helperName)) {
                        const strippedContent = stripHelperCall(content, helperName)

                        if (strippedContent !== content) {
                            content = strippedContent
                            continue
                        }
                    }

                    throw new Error(
                        `[repair-rolldown-client-init-imports] Unable to locate a reference import for ${helperName}.`,
                    )
                }

                const specifiers = importsBySource.get(helperImport.source) ?? []
                specifiers.push(`${helperImport.alias} as ${helperName}`)
                importsBySource.set(helperImport.source, specifiers)
            }

            for (const [source, specifiers] of importsBySource) {
                content = insertImport(content, source, specifiers)
            }

            await writeFile(filePath, content)
            patchedFiles.push(fileName)
        }

        if (patchedFiles.length > 0) {
            console.warn(
                `[repair-rolldown-client-init-imports] Patched missing init helper imports in ${chunksDir}: ${patchedFiles.join(', ')}`,
            )
        }
    }
}
