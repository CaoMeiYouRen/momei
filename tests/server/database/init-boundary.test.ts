import { describe, expect, it, vi } from 'vitest'

const repairLegacyPostVersionRecords = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))

vi.mock('@/server/database/post-version-repair', () => ({
    repairLegacyPostVersionRecords,
}))

describe('database initialization boundaries', () => {
    it('should still run full initialization after connection-only readiness', async () => {
        vi.resetModules()
        repairLegacyPostVersionRecords.mockClear()
        repairLegacyPostVersionRecords.mockResolvedValue(undefined)

        const databaseModule = await import('@/server/database')

        try {
            const connectionReady = await databaseModule.ensureDatabaseConnectionReady()

            expect(connectionReady).toBe(true)
            expect(repairLegacyPostVersionRecords).not.toHaveBeenCalled()

            const databaseReady = await databaseModule.ensureDatabaseReady()

            expect(databaseReady).toBe(true)
            expect(repairLegacyPostVersionRecords).toHaveBeenCalledTimes(1)
        } finally {
            if (databaseModule.dataSource.isInitialized) {
                await databaseModule.dataSource.destroy()
            }
        }
    })

    it('should retry full initialization after a maintenance failure', async () => {
        vi.resetModules()
        repairLegacyPostVersionRecords.mockReset()
        repairLegacyPostVersionRecords
            .mockRejectedValueOnce(new Error('repair failed'))
            .mockResolvedValueOnce(undefined)

        const databaseModule = await import('@/server/database')

        try {
            const firstAttemptReady = await databaseModule.ensureDatabaseReady()

            expect(firstAttemptReady).toBe(true)
            expect(repairLegacyPostVersionRecords).toHaveBeenCalledTimes(1)

            const secondAttemptReady = await databaseModule.ensureDatabaseReady()

            expect(secondAttemptReady).toBe(true)
            expect(repairLegacyPostVersionRecords).toHaveBeenCalledTimes(2)
        } finally {
            if (databaseModule.dataSource.isInitialized) {
                await databaseModule.dataSource.destroy()
            }
        }
    })
})