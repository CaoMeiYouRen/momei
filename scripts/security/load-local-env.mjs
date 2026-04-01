import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { parse, populate } from 'dotenv'

function isTruthyEnvironmentFlag(value) {
    const normalized = String(value || '').trim().toLowerCase()

    return normalized !== ''
        && normalized !== '0'
        && normalized !== 'false'
        && normalized !== 'no'
        && normalized !== 'off'
}

function isLocalExecution() {
    return !isTruthyEnvironmentFlag(process.env.CI) && !isTruthyEnvironmentFlag(process.env.GITHUB_ACTIONS)
}

function parseDotEnvFile(content) {
    return Object.entries(parse(content)).map(([key, value]) => ({ key, value }))
}

async function loadLocalEnvFile(repoRoot, options = {}) {
    if (!isLocalExecution()) {
        return {
            envFilePath: null,
            injectedKeys: [],
            loaded: false,
            skippedKeys: [],
        }
    }

    const envFileName = options.envFileName || '.env'
    const envFilePath = path.resolve(repoRoot, envFileName)
    let content

    try {
        content = await readFile(envFilePath, 'utf8')
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
            return {
                envFilePath,
                injectedKeys: [],
                loaded: false,
                skippedKeys: [],
            }
        }

        throw error
    }

    const parsedEntries = parseDotEnvFile(content)
    const parsedEnv = Object.fromEntries(parsedEntries.map(({ key, value }) => [key, value]))
    const skippedKeys = parsedEntries
        .filter(({ key }) => process.env[key] !== undefined)
        .map(({ key }) => key)
    const injectedKeys = parsedEntries
        .filter(({ key }) => process.env[key] === undefined)
        .map(({ key }) => key)

    populate(process.env, parsedEnv)

    return {
        envFilePath,
        injectedKeys,
        loaded: true,
        skippedKeys,
    }
}

export {
    isLocalExecution,
    isTruthyEnvironmentFlag,
    loadLocalEnvFile,
    parseDotEnvFile,
}
