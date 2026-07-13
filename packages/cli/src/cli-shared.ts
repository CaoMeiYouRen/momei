import chalk from 'chalk'
import ora from 'ora'
import { extractTagNames, type MomeiAutomationTaskStatusResponse } from '@momei-blog/api-client'
import { MomeiApiClient } from './api-client'

export interface ApiClientOptions {
    apiUrl?: string
    apiKey?: string
}

export function parseCsvList(input?: string) {
    return input?.split(',').map((item) => item.trim()).filter(Boolean) || []
}

export function createAutomationClient(options: ApiClientOptions) {
    if (!options.apiKey) {
        console.error(chalk.red('Error: --api-key is required'))
        process.exit(1)
    }

    return new MomeiApiClient(options.apiUrl || 'http://localhost:3000', options.apiKey)
}

export async function fetchPostForAutomation(client: MomeiApiClient, postId: string) {
    const response = await client.getPost(postId)
    return response.data as Record<string, unknown>
}

export { extractTagNames as extractExistingTagNames }

export function displayTaskCreated(label: string, data: { taskId: string, status: string }) {
    console.log(chalk.blue(`\n⚙️ ${label}\n`))
    console.log(chalk.gray(`Task ID: ${data.taskId}`))
    console.log(chalk.gray(`Status: ${data.status}\n`))
}

export function displayTaskCompletion(task: MomeiAutomationTaskStatusResponse) {
    console.log(chalk.blue('\n✅ Task Result\n'))
    console.log(JSON.stringify(task, null, 2))

    const result = task.result && typeof task.result === 'object' ? task.result : null
    if (result?.needsConfirmation === true) {
        console.log(chalk.yellow('\nThis task generated a preview. Re-run with --confirm-preview-task <taskId> to apply it.'))
    }
}

export async function waitForAutomationTask(client: MomeiApiClient, taskId: string, label: string) {
    const spinner = ora(`${label}...`).start()

    while (true) {
        const response = await client.getAITask(taskId)
        const task = response.data
        spinner.text = `${label}... ${task.progress}% (${task.status})`

        if (task.status === 'completed') {
            spinner.succeed(`${label} completed`)
            return task
        }

        if (task.status === 'failed') {
            spinner.fail(`${label} failed`)
            if (task.error) {
                console.error(chalk.red(task.error))
            }
            process.exit(1)
        }

        await new Promise((done) => setTimeout(done, 3000))
    }
}
