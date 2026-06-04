import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleSessionGovernanceEvent } from '../../scripts/ai-hooks/session-governance-shared.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fallbackProjectRoot = path.resolve(__dirname, '..', '..')

export const SessionGovernancePlugin = async ({ client, worktree }) => {
    const projectRoot = worktree || fallbackProjectRoot

    async function logInfo(message, extra = {}) {
        if (!client?.app?.log) {
            return
        }

        await client.app.log({
            body: {
                service: 'session-governance',
                level: 'info',
                message,
                extra,
            },
        })
    }

    return {
        event: async ({ event }) => {
            if (!event?.type) {
                return
            }

            if (event.type === 'session.created') {
                const result = await handleSessionGovernanceEvent({
                    eventName: 'session-start',
                    payload: event,
                    platform: 'opencode',
                    projectRoot,
                })

                if (result.additionalContext) {
                    await logInfo('OpenCode session briefing generated', {
                        preview: result.additionalContext.split('\n').slice(0, 3).join(' | '),
                    })
                }

                return
            }

            if (event.type === 'session.compacted') {
                await handleSessionGovernanceEvent({
                    eventName: 'session-compacted',
                    payload: event,
                    platform: 'opencode',
                    projectRoot,
                })

                return
            }

            if (event.type === 'session.idle') {
                await handleSessionGovernanceEvent({
                    eventName: 'session-idle',
                    payload: event,
                    platform: 'opencode',
                    projectRoot,
                })

                // Pre-stop check on idle: warn if verification is stale
                const stopResult = await handleSessionGovernanceEvent({
                    eventName: 'pre-stop-check',
                    payload: event,
                    platform: 'opencode',
                    projectRoot,
                })

                if (stopResult.additionalContext) {
                    await logInfo('OpenCode pre-stop-check: verification stale', {
                        context: stopResult.additionalContext,
                    })
                }
            }
        },

        'tool.execute.after': async (input, output) => {
            await handleSessionGovernanceEvent({
                eventName: 'post-tool-use',
                payload: {
                    toolName: input?.tool ?? input?.name,
                    toolInput: input?.args ?? input,
                    toolOutput: output,
                    timestamp: Date.now(),
                },
                platform: 'opencode',
                projectRoot,
            })

            // Post-verify: run lint/typecheck after code edits (non-blocking)
            const verifyResult = await handleSessionGovernanceEvent({
                eventName: 'post-verify',
                payload: { timestamp: Date.now() },
                platform: 'opencode',
                projectRoot,
            })

            if (verifyResult.additionalContext) {
                await logInfo('OpenCode post-verify', { result: verifyResult.additionalContext })
            }
        },

        'experimental.session.compacting': async (input, output) => {
            const result = await handleSessionGovernanceEvent({
                eventName: 'pre-compact',
                payload: input,
                platform: 'opencode',
                projectRoot,
            })

            if (result.compactionContext) {
                output.context ??= []
                output.context.push(result.compactionContext)
            }
        },
    }
}
