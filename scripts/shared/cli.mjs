import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function getCliArgs(argv = process.argv) {
    return argv.slice(2)
}

export function getArgValue(argv, name) {
    const prefix = `${name}=`
    return argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null
}

export function hasFlag(argv, name) {
    return argv.includes(name)
}

export function isDirectExecution(importMetaUrl, argvEntry = process.argv[1]) {
    if (!argvEntry) {
        return false
    }

    return importMetaUrl === pathToFileURL(path.resolve(argvEntry)).href
}
