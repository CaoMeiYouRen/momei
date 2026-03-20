import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { CAC } from 'cac'
import chalk from 'chalk'
import ora from 'ora'
import { parseHexoFiles } from './parser'
import { MomeiApiClient } from './api-client'
import { buildLinkGovernanceRequest, parseCliLinkGovernanceScopes } from './link-governance'
import { parseCsvList } from './cli-shared'
import type {
    CliLinkGovernanceMode,
    CliLinkGovernanceReportData,
} from './types'

interface GovernLinksCommandOptions {
    apiUrl: string
    apiKey?: string
    mode: CliLinkGovernanceMode
    domains?: string
    pathPrefixes?: string
    scopes?: string
    validationMode?: 'static' | 'static+online'
    legacyOrigin?: string
    reportFile?: string
    retryReportId?: string
    allowRelativeLinks?: boolean
    skipConfirmation?: boolean
    verbose?: boolean
}

function displayGovernanceSummary(report: CliLinkGovernanceReportData) {
    console.log(chalk.blue('\n🧭 Link Governance Summary\n'))
    console.log(chalk.gray(`  Report ID: ${report.reportId}`))
    console.log(chalk.gray(`  Mode: ${report.mode}`))
    console.log(chalk.green(`  Resolved: ${report.summary.resolved}`))
    console.log(chalk.yellow(`  Rewritten: ${report.summary.rewritten}`))
    console.log(chalk.gray(`  Unchanged: ${report.summary.unchanged}`))
    console.log(chalk.yellow(`  Skipped: ${report.summary.skipped}`))
    console.log(chalk.red(`  Failed: ${report.summary.failed}`))
    console.log(chalk.magenta(`  Needs Confirmation: ${report.summary.needsConfirmation}\n`))
}

async function maybeWriteGovernanceReport(report: CliLinkGovernanceReportData, reportFile?: string) {
    if (!reportFile) {
        return
    }

    const outputPath = resolve(process.cwd(), reportFile)
    const payload = reportFile.endsWith('.md')
        ? report.markdown || JSON.stringify(report, null, 2)
        : JSON.stringify(report, null, 2)
    await writeFile(outputPath, payload, 'utf-8')
    console.log(chalk.gray(`Saved report to ${outputPath}`))
}

async function runGovernLinks(source: string, options: GovernLinksCommandOptions) {
    if (!options.apiKey) {
        console.error(chalk.red('Error: --api-key is required'))
        process.exit(1)
    }

    const sourceDir = resolve(process.cwd(), source)
    const spinner = ora('Scanning source files and generating governance seeds...').start()

    try {
        const entries = await parseHexoFiles(sourceDir, options.verbose)
        const request = buildLinkGovernanceRequest(entries, {
            scopes: parseCliLinkGovernanceScopes(parseCsvList(options.scopes)),
            domains: parseCsvList(options.domains),
            pathPrefixes: parseCsvList(options.pathPrefixes),
            validationMode: options.validationMode,
            allowRelativeLinks: options.allowRelativeLinks,
            retryFailuresFromReportId: options.retryReportId,
            skipConfirmation: options.skipConfirmation,
            legacyOrigin: options.legacyOrigin,
            reportFormat: options.reportFile?.endsWith('.md') ? 'markdown' : 'json',
        })

        spinner.succeed(chalk.green(`Generated ${request.seeds?.length || 0} mapping seeds from ${entries.length} files`))

        if (options.verbose && request.seeds && request.seeds.length > 0) {
            request.seeds.slice(0, 10).forEach((seed) => {
                console.log(chalk.gray(`  - ${seed.source} -> ${seed.targetRef.slug || seed.targetRef.id || 'unknown'}`))
            })
        }

        const client = new MomeiApiClient(options.apiUrl, options.apiKey)
        const response = options.mode === 'apply'
            ? await client.applyLinkGovernance(request)
            : await client.dryRunLinkGovernance(request)

        displayGovernanceSummary(response.data)
        await maybeWriteGovernanceReport(response.data, options.reportFile)
    } catch (error) {
        spinner.fail(chalk.red('Failed to execute link governance'))

        if (error instanceof Error) {
            console.error(chalk.red(`\nError: ${error.message}`))
            if (options.verbose && error.stack) {
                console.error(chalk.gray(error.stack))
            }
        }

        process.exit(1)
    }
}

export function registerGovernLinksCommand(cli: CAC) {
    cli
        .command('govern-links <source>', 'Generate mapping seeds and run migration link governance')
        .option('--api-url <url>', 'Momei API URL', { default: 'http://localhost:3000' })
        .option('--api-key <key>', 'Momei API Key (required)')
        .option('--mode <mode>', 'Governance mode: dry-run or apply', { default: 'dry-run' })
        .option('--domains <domains>', 'Comma separated legacy domains')
        .option('--path-prefixes <prefixes>', 'Comma separated managed path prefixes')
        .option('--scopes <scopes>', 'Comma separated scopes', { default: 'asset-url,post-link,permalink-rule' })
        .option('--validation-mode <mode>', 'Validation mode: static or static+online', { default: 'static' })
        .option('--legacy-origin <url>', 'Legacy site origin used to generate absolute seeds')
        .option('--report-file <file>', 'Save the report to a file')
        .option('--retry-report-id <id>', 'Retry failed items from a previous report ID')
        .option('--allow-relative-links', 'Allow governance for relative content links', { default: false })
        .option('--skip-confirmation', 'Apply even when an item requires manual confirmation', { default: false })
        .option('--verbose', 'Verbose output', { default: false })
        .action(async (source: string, options: GovernLinksCommandOptions) => {
            await runGovernLinks(source, options)
        })
}
