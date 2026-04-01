import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

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

function stripWrappingQuotes(value) {
    if (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\'')))) {
        return value.slice(1, -1)
    }

    return value
}

function parseDotEnvLine(line) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
        return null
    }

    const normalized = trimmed.startsWith('export ') ? trimmed.slice('export '.length).trim() : trimmed
    const separatorIndex = normalized.indexOf('=')
    if (separatorIndex === -1) {
        return null
    }

    const key = normalized.slice(0, separatorIndex).trim()
    const rawValue = normalized.slice(separatorIndex + 1).trim()
    return {
        key,
        value: stripWrappingQuotes(rawValue),
    }
}

function parseDotEnvFile(content) {
    return content
        .split(/\r?\n/)
        .map(parseDotEnvLine)
        .filter(Boolean)
}

function populateProcessEnv(entries) {
    for (const { key, value } of entries) {
        if (process.env[key] === undefined) {
            process.env[key] = value
        }
    }
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
    const skippedKeys = parsedEntries
        .filter(({ key }) => process.env[key] !== undefined)
        .map(({ key }) => key)
    const injectedKeys = parsedEntries
        .filter(({ key }) => process.env[key] === undefined)
        .map(({ key }) => key)

    populateProcessEnv(parsedEntries)

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
