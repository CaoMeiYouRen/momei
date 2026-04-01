import path from 'node:path'
import { pathToFileURL } from 'node:url'

export function isDirectExecution(importMetaUrl, argvEntry = process.argv[1]) {
    if (!argvEntry) {
        return false
    }

    return importMetaUrl === pathToFileURL(path.resolve(argvEntry)).href
}
