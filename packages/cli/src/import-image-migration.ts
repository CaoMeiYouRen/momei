import { constants } from 'node:fs'
import { access, readFile } from 'node:fs/promises'
import { basename, dirname, extname, isAbsolute, resolve } from 'node:path'
import type {
    CliDirectUploadAuthorization,
    CliDirectUploadPresignStrategy,
    CliDirectUploadRequest,
} from './types'
import type { ParsedPost } from './types'

const markdownImagePattern = /!\[[^\]]*\]\(\s*(<[^>\n]+>|[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/gu
const htmlImagePattern = /<img\b[^>]*?\bsrc\s*=\s*(['"])([^'"]+)\1[^>]*>/giu
const DEFAULT_UPLOAD_PREFIX = 'migrations/image/'

const imageMimeTypeMap: Record<string, string> = {
    '.apng': 'image/apng',
    '.avif': 'image/avif',
    '.bmp': 'image/bmp',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.tif': 'image/tiff',
    '.tiff': 'image/tiff',
    '.webp': 'image/webp',
}

type LocalImageReferenceField = 'content' | 'coverImage'

type UploadCacheResult =
    | { ok: true, url: string }
    | { ok: false, reason: string }

export interface LocalImageMigrationReportItem {
    sourceFile: string
    field: LocalImageReferenceField
    reference: string
    resolvedPath?: string
    status: 'replaced' | 'failed' | 'skipped'
    uploadedUrl?: string
    reason?: string
}

export interface LocalImageMigrationReport {
    enabled: true
    summary: {
        scanned: number
        replaced: number
        failed: number
        skipped: number
        uploaded: number
    }
    items: LocalImageMigrationReportItem[]
}

export interface LocalImageMigrationOptions {
    sourceDir: string
    dryRun: boolean
    uploadPrefix?: string
    authorizeDirectUpload?: (payload: CliDirectUploadRequest) => Promise<CliDirectUploadAuthorization>
    uploadWithPresign?: (authorization: CliDirectUploadPresignStrategy, fileBuffer: Uint8Array) => Promise<void>
}

function normalizeReferenceSource(rawSource: string) {
    const trimmed = rawSource.trim()
    if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        return trimmed.slice(1, -1).trim()
    }

    return trimmed
}

function stripQueryAndHash(value: string) {
    const queryIndex = value.indexOf('?')
    const hashIndex = value.indexOf('#')

    const cutIndex = [queryIndex, hashIndex]
        .filter((index) => index >= 0)
        .reduce((min, index) => Math.min(min, index), Number.POSITIVE_INFINITY)

    return Number.isFinite(cutIndex) ? value.slice(0, cutIndex) : value
}

function tryDecodeURIComponent(value: string) {
    try {
        return decodeURIComponent(value)
    } catch {
        return value
    }
}

function isLocalImageReference(reference: string) {
    if (!reference) {
        return false
    }

    if (/^[A-Za-z]:[\\/]/u.test(reference)) {
        return true
    }

    if (reference.startsWith('//') || reference.startsWith('#')) {
        return false
    }

    return !/^[A-Za-z][A-Za-z\d+.-]*:/u.test(reference)
}

function normalizeUploadPrefix(prefix?: string) {
    const basePrefix = (prefix || DEFAULT_UPLOAD_PREFIX).trim().replace(/\\/g, '/').replace(/^\/+/u, '')
    if (!basePrefix) {
        return ''
    }

    return basePrefix.endsWith('/') ? basePrefix : `${basePrefix}/`
}

function resolveLocalImagePath(reference: string, sourceFilePath: string, sourceDir: string) {
    const normalizedReference = tryDecodeURIComponent(stripQueryAndHash(reference).trim())
    if (!normalizedReference) {
        return null
    }

    if (normalizedReference.startsWith('/') || normalizedReference.startsWith('\\')) {
        const rootRelativePath = normalizedReference.replace(/\\/g, '/')
        return resolve(sourceDir, `.${rootRelativePath}`)
    }

    if (isAbsolute(normalizedReference)) {
        return normalizedReference
    }

    return resolve(dirname(sourceFilePath), normalizedReference)
}

async function isReadableFile(filePath: string) {
    try {
        await access(filePath, constants.R_OK)
        return true
    } catch {
        return false
    }
}

function guessImageContentType(filePath: string) {
    const extension = extname(filePath).toLowerCase()
    return imageMimeTypeMap[extension] || 'application/octet-stream'
}

async function defaultUploadWithPresign(authorization: CliDirectUploadPresignStrategy, fileBuffer: Uint8Array) {
    const normalizedBuffer = new Uint8Array(fileBuffer.byteLength)
    normalizedBuffer.set(fileBuffer)
    const uploadBody = new Blob([normalizedBuffer])

    const response = await fetch(authorization.url, {
        method: authorization.method,
        headers: authorization.headers,
        body: uploadBody,
    })

    if (!response.ok) {
        throw new Error(`Direct upload failed (${response.status} ${response.statusText})`)
    }
}

function mapOutsideCodeFences(markdown: string, transformSegment: (segment: string) => string) {
    if (!markdown) {
        return markdown
    }

    let transformedMarkdown = ''
    let plainTextBuffer = ''
    let index = 0

    while (index < markdown.length) {
        const lineEnd = markdown.indexOf('\n', index)
        const nextIndex = lineEnd === -1 ? markdown.length : lineEnd + 1
        const line = markdown.slice(index, lineEnd === -1 ? markdown.length : lineEnd)
        const fenceMatch = /^ {0,3}((`{3,})|(~{3,})).*$/u.exec(line)

        if (!fenceMatch) {
            plainTextBuffer += markdown.slice(index, nextIndex)
            index = nextIndex
            continue
        }

        transformedMarkdown += transformSegment(plainTextBuffer)
        plainTextBuffer = ''

        const delimiter = fenceMatch[1]
        if (!delimiter) {
            plainTextBuffer += markdown.slice(index, nextIndex)
            index = nextIndex
            continue
        }

        const fenceChar = delimiter[0]
        const minimumDelimiterLength = delimiter.length
        let blockEnd = nextIndex
        let cursor = nextIndex

        while (cursor < markdown.length) {
            const closingLineEnd = markdown.indexOf('\n', cursor)
            const closingNextIndex = closingLineEnd === -1 ? markdown.length : closingLineEnd + 1
            const closingLine = markdown.slice(cursor, closingLineEnd === -1 ? markdown.length : closingLineEnd)
            const closingPattern = new RegExp(`^ {0,3}${fenceChar}{${minimumDelimiterLength},}[ \t]*$`, 'u')

            blockEnd = closingNextIndex
            if (closingPattern.test(closingLine)) {
                break
            }

            cursor = closingNextIndex
        }

        transformedMarkdown += markdown.slice(index, blockEnd)
        index = blockEnd
    }

    transformedMarkdown += transformSegment(plainTextBuffer)
    return transformedMarkdown
}

function collectContentLocalImageReferences(content: string) {
    const references = new Set<string>()

    mapOutsideCodeFences(content, (segment) => {
        for (const match of segment.matchAll(markdownImagePattern)) {
            const source = normalizeReferenceSource(match[1] || '')
            if (source && isLocalImageReference(source)) {
                references.add(source)
            }
        }

        for (const match of segment.matchAll(htmlImagePattern)) {
            const source = normalizeReferenceSource(match[2] || '')
            if (source && isLocalImageReference(source)) {
                references.add(source)
            }
        }

        return segment
    })

    return [...references]
}

function rewriteContentLocalImageReferences(content: string, replacements: Map<string, string>) {
    if (replacements.size === 0) {
        return content
    }

    return mapOutsideCodeFences(content, (segment) => {
        const markdownRewritten = segment.replace(markdownImagePattern, (match, rawSource) => {
            const source = normalizeReferenceSource(rawSource || '')
            const replacement = replacements.get(source)
            if (!replacement) {
                return match
            }

            const replacementSource = rawSource.trim().startsWith('<') && rawSource.trim().endsWith('>')
                ? `<${replacement}>`
                : replacement

            return match.replace(rawSource, replacementSource)
        })

        return markdownRewritten.replace(htmlImagePattern, (match, _quote, rawSource) => {
            const source = normalizeReferenceSource(rawSource || '')
            const replacement = replacements.get(source)
            if (!replacement) {
                return match
            }

            return match.replace(rawSource, replacement)
        })
    })
}

export async function migrateImportEntriesLocalImages(entries: ParsedPost[], options: LocalImageMigrationOptions): Promise<LocalImageMigrationReport> {
    if (!options.dryRun && !options.authorizeDirectUpload) {
        throw new Error('authorizeDirectUpload is required when local image upload is enabled outside dry-run mode')
    }

    const uploadWithPresign = options.uploadWithPresign || defaultUploadWithPresign
    const uploadPrefix = normalizeUploadPrefix(options.uploadPrefix)
    const uploadCache = new Map<string, Promise<UploadCacheResult>>()
    const uploadedPaths = new Set<string>()

    const report: LocalImageMigrationReport = {
        enabled: true,
        summary: {
            scanned: 0,
            replaced: 0,
            failed: 0,
            skipped: 0,
            uploaded: 0,
        },
        items: [],
    }

    async function uploadFromLocalPath(localPath: string) {
        const cached = uploadCache.get(localPath)
        if (cached) {
            return cached
        }

        const pendingUpload = (async (): Promise<UploadCacheResult> => {
            try {
                const fileBuffer = await readFile(localPath)
                const authorization = await options.authorizeDirectUpload!({
                    filename: basename(localPath),
                    contentType: guessImageContentType(localPath),
                    size: fileBuffer.byteLength,
                    type: 'image',
                    prefix: uploadPrefix,
                })

                if (authorization.strategy !== 'put-presign') {
                    return {
                        ok: false,
                        reason: 'Upload strategy "proxy" is not supported by CLI image migration. Please configure direct S3/R2 upload or upload manually.',
                    }
                }

                await uploadWithPresign(authorization, fileBuffer)
                uploadedPaths.add(localPath)

                return {
                    ok: true,
                    url: authorization.publicUrl,
                }
            } catch (error) {
                return {
                    ok: false,
                    reason: error instanceof Error ? error.message : 'Unknown upload error',
                }
            }
        })()

        uploadCache.set(localPath, pendingUpload)
        return pendingUpload
    }

    async function processReference(entry: ParsedPost, field: LocalImageReferenceField, reference: string): Promise<LocalImageMigrationReportItem> {
        const resolvedPath = resolveLocalImagePath(reference, entry.file, options.sourceDir)
        if (!resolvedPath) {
            return {
                sourceFile: entry.relativeFile,
                field,
                reference,
                status: 'failed',
                reason: 'Failed to resolve local file path',
            }
        }

        if (!(await isReadableFile(resolvedPath))) {
            return {
                sourceFile: entry.relativeFile,
                field,
                reference,
                resolvedPath,
                status: 'failed',
                reason: 'Local file does not exist or is not readable',
            }
        }

        if (options.dryRun) {
            return {
                sourceFile: entry.relativeFile,
                field,
                reference,
                resolvedPath,
                status: 'skipped',
                reason: 'dry-run mode',
            }
        }

        const uploadResult = await uploadFromLocalPath(resolvedPath)
        if (!uploadResult.ok) {
            return {
                sourceFile: entry.relativeFile,
                field,
                reference,
                resolvedPath,
                status: 'failed',
                reason: uploadResult.reason,
            }
        }

        return {
            sourceFile: entry.relativeFile,
            field,
            reference,
            resolvedPath,
            status: 'replaced',
            uploadedUrl: uploadResult.url,
        }
    }

    for (const entry of entries) {
        const content = entry.post.content || ''
        const contentReferences = collectContentLocalImageReferences(content)
        const contentReplacements = new Map<string, string>()

        for (const reference of contentReferences) {
            report.summary.scanned += 1
            const item = await processReference(entry, 'content', reference)
            report.items.push(item)

            if (item.status === 'replaced' && item.uploadedUrl) {
                report.summary.replaced += 1
                contentReplacements.set(reference, item.uploadedUrl)
            }
            if (item.status === 'failed') {
                report.summary.failed += 1
            }
            if (item.status === 'skipped') {
                report.summary.skipped += 1
            }
        }

        if (contentReplacements.size > 0) {
            const rewrittenContent = rewriteContentLocalImageReferences(content, contentReplacements)
            entry.post.content = rewrittenContent
            entry.content = rewrittenContent
        }

        const coverImage = typeof entry.post.coverImage === 'string'
            ? normalizeReferenceSource(entry.post.coverImage)
            : ''

        if (coverImage && isLocalImageReference(coverImage)) {
            report.summary.scanned += 1
            const item = await processReference(entry, 'coverImage', coverImage)
            report.items.push(item)

            if (item.status === 'replaced' && item.uploadedUrl) {
                report.summary.replaced += 1
                entry.post.coverImage = item.uploadedUrl
            }
            if (item.status === 'failed') {
                report.summary.failed += 1
            }
            if (item.status === 'skipped') {
                report.summary.skipped += 1
            }
        }
    }

    report.summary.uploaded = uploadedPaths.size
    return report
}
