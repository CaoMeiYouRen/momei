#!/usr/bin/env node
/**
 * Validate that bare-name pnpm overrides (e.g. `fast-uri: "^3.1.4"`) actually
 * resolve to a version range that covers the patched threshold of every known
 * high+ advisory for that package.
 *
 * Background: writing `fast-uri: "^3.1.4"` while the patched threshold is
 * `>=3.1.6` still leaves the lockfile on 3.1.5 and silently reintroduces a
 * previously fixed CVE. `pnpm audit` will only flag this after the override
 * lands in `master`; this gate surfaces the issue with an actionable
 * remediation hint at PR time.
 *
 * Reuses the `pnpm audit --json` payload (no extra registry round-trip) and
 * the existing dependency-risk allowlist (so allowlisted packages do not
 * trigger).
 */
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

import { isDirectExecution, parseCliOptions } from '../shared/cli.mjs'
import { loadLocalEnvFile } from './load-local-env.mjs'
import { readAllowlist } from './check-dependency-risk.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..')

const DEFAULTS = {
    allowlist: '.github/security/dependency-risk-allowlist.json',
    input: null,
    lockfile: 'pnpm-lock.yaml',
    mode: 'error',
    registry: 'https://registry.npmjs.org/',
    workspace: 'pnpm-workspace.yaml',
}

const SEVERITY_RANK = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 }

/**
 * Parse a `x.y.z` version string into a comparable tuple. Pre-release tags
 * are ignored on purpose — the lockfile only stores stable versions for
 * overridden packages in practice, and we only compare against patched
 * thresholds that come from advisories (also stable).
 */
function parseVersion(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)/u.exec(String(version || '').trim())
    if (!match) {
        return null
    }
    return [Number(match[1]), Number(match[2]), Number(match[3])]
}

function compareVersions(left, right) {
    for (let i = 0; i < 3; i++) {
        if (left[i] !== right[i]) {
            return left[i] - right[i]
        }
    }
    return 0
}

/**
 * Extract the lowest "fixed-in" version from a `patched_versions` string.
 * Handles compound expressions like `">=3.1.6 <4.0.0"` or
 * `">=3.1.6 || >=4.0.0"`. Returns `null` when no actionable patched version
 * is declared (`unavailable`, `*`, or empty).
 */
function extractMinPatchedVersion(patchedVersions) {
    const raw = String(patchedVersions || '').trim()
    if (!raw || raw === 'unavailable' || raw === '*') {
        return null
    }

    const candidates = []
    for (const segment of raw.split('||')) {
        const match = />=\s*(\d+\.\d+\.\d+)/u.exec(segment)
        if (match) {
            const parsed = parseVersion(match[1])
            if (parsed) {
                candidates.push({ parsed, version: match[1] })
            }
        }
    }

    if (candidates.length === 0) {
        return null
    }

    candidates.sort((left, right) => compareVersions(left.parsed, right.parsed))
    return candidates[0].version
}

/**
 * Returns true for bare-name override keys (`fast-uri`, `@scope/pkg`) and
 * false for version-scoped ones (`fast-uri@^3.1.4`, `@scope/pkg@^2`).
 */
function isBareOverrideKey(key) {
    if (key.startsWith('@')) {
        return key.indexOf('@', 1) === -1
    }
    return !key.includes('@')
}

function parseBareOverrides(workspaceYaml) {
    const overrides = workspaceYaml?.overrides || {}
    const result = {}
    for (const [key, value] of Object.entries(overrides)) {
        if (!isBareOverrideKey(key)) {
            continue
        }
        result[key] = String(value).trim()
    }
    return result
}

/**
 * Inspect every `snapshots[*].dependencies` reference and record the highest
 * version of each dependency that the lockfile would actually install. The
 * resolution section is intentionally ignored — overrides rewrite the
 * resolution before it ever reaches the snapshot stage.
 */
function parseInstalledVersionsFromLockfile(lockfileText) {
    const parsed = yaml.load(lockfileText)
    const snapshots = parsed?.snapshots && typeof parsed.snapshots === 'object'
        ? parsed.snapshots
        : {}

    const collected = new Map()

    for (const snapshot of Object.values(snapshots)) {
        if (!snapshot || typeof snapshot !== 'object') {
            continue
        }
        const dependencies = snapshot.dependencies
        if (!dependencies || typeof dependencies !== 'object') {
            continue
        }
        for (const [name, version] of Object.entries(dependencies)) {
            const normalized = String(version).trim()
            const parsedVersion = parseVersion(normalized)
            if (!parsedVersion) {
                continue
            }
            const bucket = collected.get(name) || []
            bucket.push({ parsed: parsedVersion, version: normalized })
            collected.set(name, bucket)
        }
    }

    const result = {}
    for (const [name, entries] of collected) {
        entries.sort((left, right) => compareVersions(left.parsed, right.parsed))
        result[name] = entries[entries.length - 1].version
    }
    return result
}

function resolveAdvisoryId(advisory) {
    if (advisory.github_advisory_id) {
        return String(advisory.github_advisory_id)
    }
    if (Array.isArray(advisory.cves) && advisory.cves[0]) {
        return String(advisory.cves[0])
    }
    if (advisory.url) {
        return String(advisory.url)
    }
    return 'unknown'
}

function isAllowlisted({ advisory, allowlistEntries, paths }) {
    return allowlistEntries.some((entry) => (
        entry.advisoryId === resolveAdvisoryId(advisory)
        && entry.packageName === advisory.name
        && entry.severity === String(advisory.severity || '').toLowerCase()
        && paths.length > 0
        && paths.every((path) => entry.approvedPaths.includes(path))
    ))
}

/**
 * Walk the pnpm audit JSON and group every actionable high+ advisory by the
 * package it concerns. Returns a map `{ pkgName: [{advisoryId, severity,
 * minPatched, title, patchedRaw}] }`.
 */
function collectAdvisoriesByPackage(auditJson, allowlistEntries) {
    const result = new Map()
    const vulnerabilities = auditJson?.vulnerabilities && typeof auditJson.vulnerabilities === 'object'
        ? auditJson.vulnerabilities
        : {}

    for (const [pkgName, vuln] of Object.entries(vulnerabilities)) {
        if (!vuln || typeof vuln !== 'object') {
            continue
        }
        const viaItems = Array.isArray(vuln.via)
            ? vuln.via.filter((item) => item && typeof item === 'object')
            : []
        if (viaItems.length === 0) {
            continue
        }

        const paths = Array.isArray(vuln.nodes) ? vuln.nodes.map((node) => String(node)) : []

        for (const advisory of viaItems) {
            if (isAllowlisted({ advisory, allowlistEntries, paths })) {
                continue
            }

            const severity = String(advisory.severity || '').toLowerCase()
            if (!(severity in SEVERITY_RANK) || SEVERITY_RANK[severity] < SEVERITY_RANK.high) {
                continue
            }

            const minPatched = extractMinPatchedVersion(advisory.patched_versions)
            if (!minPatched) {
                continue
            }

            const advisoryId = resolveAdvisoryId(advisory)
            const bucket = result.get(pkgName) || []
            bucket.push({
                advisoryId,
                minPatched,
                patchedRaw: String(advisory.patched_versions || '').trim(),
                severity,
                title: advisory.title || `${pkgName} vulnerability`,
            })
            result.set(pkgName, bucket)
        }
    }

    return result
}

/**
 * For each bare-name override, look up the actually installed version and
 * every actionable high+ advisory. A violation exists when the installed
 * version is strictly below the lowest patched threshold.
 */
function evaluateOverrides({ bareOverrides, installedVersions, advisoriesByPackage }) {
    const violations = []
    const skipped = []

    for (const [pkgName, overrideRange] of Object.entries(bareOverrides)) {
        const advisories = advisoriesByPackage.get(pkgName)
        if (!advisories || advisories.length === 0) {
            continue
        }

        const installed = installedVersions[pkgName]
        if (!installed) {
            skipped.push({ pkgName, overrideRange, reason: 'override declared but package not reachable from any snapshot' })
            continue
        }

        const installedParsed = parseVersion(installed)
        if (!installedParsed) {
            skipped.push({ pkgName, overrideRange, installed, reason: 'installed version is not a stable semver' })
            continue
        }

        for (const advisory of advisories) {
            const patchedParsed = parseVersion(advisory.minPatched)
            if (!patchedParsed) {
                continue
            }
            if (compareVersions(installedParsed, patchedParsed) < 0) {
                violations.push({
                    pkgName,
                    overrideRange,
                    installed,
                    minPatched: advisory.minPatched,
                    patchedRaw: advisory.patchedRaw,
                    severity: advisory.severity,
                    title: advisory.title,
                    advisoryId: advisory.advisoryId,
                })
            }
        }
    }

    return { skipped, violations }
}

async function loadAuditReport(args) {
    if (args.input) {
        const content = await readFile(path.resolve(args.input), 'utf8')
        return JSON.parse(content)
    }

    return new Promise((resolve, reject) => {
        const child = spawn(
            process.platform === 'win32' ? (process.env.comspec || 'cmd.exe') : 'pnpm',
            process.platform === 'win32'
                ? ['/d', '/s', '/c', `pnpm audit --json --registry=${args.registry}`]
                : ['audit', '--json', `--registry=${args.registry}`],
            { cwd: process.cwd(), env: process.env, stdio: ['ignore', 'pipe', 'pipe'] },
        )

        let stdout = ''
        let stderr = ''
        child.stdout.on('data', (chunk) => { stdout += chunk.toString() })
        child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
        child.on('error', (error) => { reject(error) })
        child.on('close', () => {
            if (!stdout.trim()) {
                reject(new Error(`pnpm audit produced no JSON output. ${stderr.trim()}`.trim()))
                return
            }
            try {
                resolve(JSON.parse(stdout))
            } catch (error) {
                reject(new Error(`Failed to parse pnpm audit JSON output: ${error.message}`))
            }
        })
    })
}

function printViolation(violation) {
    console.info(`- override ${violation.pkgName}: "${violation.overrideRange}" → installs ${violation.installed}, but ${violation.advisoryId} (${violation.severity}) requires patched >= ${violation.minPatched}`)
    console.info(`  title: ${violation.title}`)
    console.info(`  remediation: raise the override to "^${violation.minPatched}" or ">=${violation.minPatched}" and refresh pnpm-lock.yaml`)
}

function printSkipped(skipped) {
    for (const item of skipped) {
        console.info(`- skipped ${item.pkgName}: ${item.reason}${item.installed ? ` (installed ${item.installed})` : ''} (override: "${item.overrideRange}")`)
    }
}

async function main() {
    await loadLocalEnvFile(repoRoot)

    const args = parseCliOptions(process.argv, {
        defaults: DEFAULTS,
        values: {
            '--allowlist': { key: 'allowlist' },
            '--input': { key: 'input' },
            '--lockfile': { key: 'lockfile' },
            '--mode': { key: 'mode', allowedValues: ['warn', 'error'], invalidMessage: (value) => `Unsupported mode: ${value}` },
            '--registry': { key: 'registry' },
            '--workspace': { key: 'workspace' },
        },
    })

    if (!['warn', 'error'].includes(args.mode)) {
        throw new Error(`Unsupported mode: ${args.mode}`)
    }

    const [workspaceText, lockfileText, allowlistEntries, auditJson] = await Promise.all([
        readFile(path.resolve(args.workspace), 'utf8'),
        readFile(path.resolve(args.lockfile), 'utf8'),
        readAllowlist(args.allowlist),
        loadAuditReport(args),
    ])

    const workspaceYaml = yaml.load(workspaceText) || {}
    const bareOverrides = parseBareOverrides(workspaceYaml)
    const installedVersions = parseInstalledVersionsFromLockfile(lockfileText)
    const advisoriesByPackage = collectAdvisoriesByPackage(auditJson, allowlistEntries)

    const { violations, skipped } = evaluateOverrides({
        advisoriesByPackage,
        bareOverrides,
        installedVersions,
    })

    console.info('Override vs Patched-Version Gate')
    console.info(`- workspace: ${args.workspace}`)
    console.info(`- lockfile: ${args.lockfile}`)
    console.info(`- bare-name overrides scanned: ${Object.keys(bareOverrides).length}`)
    console.info(`- high+ advisories inspected: ${Array.from(advisoriesByPackage.values()).reduce((acc, items) => acc + items.length, 0)}`)
    console.info(`- mode: ${args.mode}`)

    if (skipped.length > 0) {
        console.info('\nSkipped overrides:')
        printSkipped(skipped)
    }

    if (violations.length === 0) {
        console.info('\nNo bare-name override ships a vulnerable version.')
        return
    }

    console.info(`\nBlocking violations (${violations.length}):`)
    violations.forEach(printViolation)

    if (args.mode === 'error') {
        process.exitCode = 1
    }
}

if (isDirectExecution(import.meta.url)) {
    main().catch((error) => {
        console.error(`[override-patched-gate] ${error.message}`)
        process.exitCode = 1
    })
}

export {
    collectAdvisoriesByPackage,
    compareVersions,
    evaluateOverrides,
    extractMinPatchedVersion,
    isBareOverrideKey,
    parseBareOverrides,
    parseInstalledVersionsFromLockfile,
    parseVersion,
}
