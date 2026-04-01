import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function getCliArgs(argv = process.argv) {
    if (argv.length > 0 && argv.every((arg) => typeof arg === 'string' && arg.startsWith('-'))) {
        return [...argv]
    }

    return argv.slice(2)
}

export function getArgValue(argv, name) {
    const prefix = `${name}=`
    return argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null
}

export function hasFlag(argv, name) {
    return argv.includes(name)
}

export function ensureAllowedValue(value, allowedValues, invalidMessage) {
    if (allowedValues.includes(value)) {
        return value
    }

    throw new Error(typeof invalidMessage === 'function' ? invalidMessage(value) : invalidMessage)
}

export function parseCliOptions(argv, config = {}) {
    const cliArgs = getCliArgs(argv)
    const defaults = config.defaults ?? {}
    const flags = config.flags ?? {}
    const values = config.values ?? {}
    const allowUnknown = config.allowUnknown ?? false
    const options = { ...defaults }

    for (const arg of cliArgs) {
        if (!arg.startsWith('--')) {
            if (allowUnknown) {
                continue
            }

            throw new Error(`Unsupported argument: ${arg}`)
        }

        if (arg.includes('=')) {
            const separatorIndex = arg.indexOf('=')
            const optionName = arg.slice(0, separatorIndex)
            const rawValue = arg.slice(separatorIndex + 1)
            const definition = values[optionName]

            if (!definition) {
                if (allowUnknown) {
                    continue
                }

                throw new Error(`Unsupported argument: ${arg}`)
            }

            const nextValue = definition.parse ? definition.parse(rawValue) : rawValue

            if (definition.allowedValues) {
                ensureAllowedValue(nextValue, definition.allowedValues, definition.invalidMessage ?? ((value) => `Unsupported value for ${optionName}: ${value}`))
            }

            if (definition.collect) {
                options[definition.key] = definition.collect(options[definition.key], nextValue)
                continue
            }

            options[definition.key] = nextValue
            continue
        }

        const definition = flags[arg]
        if (!definition) {
            if (allowUnknown) {
                continue
            }

            throw new Error(`Unsupported argument: ${arg}`)
        }

        const nextValue = definition.value ?? true

        if (definition.collect) {
            options[definition.key] = definition.collect(options[definition.key], nextValue)
            continue
        }

        options[definition.key] = nextValue
    }

    return options
}

export function isDirectExecution(importMetaUrl, argvEntry = process.argv[1]) {
    if (!argvEntry) {
        return false
    }

    return importMetaUrl === pathToFileURL(path.resolve(argvEntry)).href
}
