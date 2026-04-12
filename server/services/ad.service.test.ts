import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdLocation, CampaignStatus } from '@/types/ad'

const { getRepositoryMock, adapterGetMock, InMock } = vi.hoisted(() => ({
    getRepositoryMock: vi.fn(),
    adapterGetMock: vi.fn(),
    InMock: vi.fn((ids: string[]) => ({ $in: ids })),
}))

vi.mock('typeorm', async () => {
    const actual = await vi.importActual<typeof import('typeorm')>('typeorm')
    return {
        ...actual,
        In: InMock,
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: getRepositoryMock,
    },
}))

vi.mock('./adapters', () => ({
    adAdapterRegistry: {
        get: adapterGetMock,
    },
}))

import {
    createCampaign,
    createPlacement,
    deleteCampaign,
    deletePlacement,
    getAdForPlacement,
    getAllCampaigns,
    getAllPlacements,
    getCampaignById,
    getPlacementById,
    getPlacementsByLocation,
    recordClick,
    recordImpression,
    updateCampaign,
    updatePlacement,
    updatePlacementStatus,
} from './ad'

function makePlacement(overrides: Record<string, unknown> = {}) {
    return {
        id: 'placement-1',
        adapterId: 'adsense',
        enabled: true,
        location: AdLocation.HEADER,
        priority: 10,
        createdAt: new Date('2026-01-01'),
        targeting: null,
        campaign: null,
        ...overrides,
    }
}

describe('ad service repo and filtering helpers', () => {
    const placementQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        addOrderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn(),
    }

    const placementRepo = {
        createQueryBuilder: vi.fn(() => placementQueryBuilder),
        find: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn((data) => ({ ...data })),
        save: vi.fn(async (data) => data),
        update: vi.fn(),
        delete: vi.fn(),
    }

    const campaignRepo = {
        find: vi.fn(),
        findOne: vi.fn(),
        create: vi.fn((data) => ({ ...data })),
        save: vi.fn(async (data) => data),
        update: vi.fn(),
        delete: vi.fn(),
        increment: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        placementQueryBuilder.leftJoinAndSelect.mockReturnThis()
        placementQueryBuilder.where.mockReturnThis()
        placementQueryBuilder.andWhere.mockReturnThis()
        placementQueryBuilder.orderBy.mockReturnThis()
        placementQueryBuilder.addOrderBy.mockReturnThis()
        getRepositoryMock.mockImplementation((entity: { name?: string }) => {
            if (entity?.name === 'AdPlacement') {
                return placementRepo
            }

            if (entity?.name === 'AdCampaign') {
                return campaignRepo
            }

            throw new Error(`Unexpected repository: ${String(entity?.name)}`)
        })
        adapterGetMock.mockReturnValue({
            supportsLocale: vi.fn(() => true),
            getPlacementHtml: vi.fn(() => '<ins>ad</ins>'),
        })
    })

    it('filters placements by locale, campaign state and session limits', async () => {
        placementQueryBuilder.getMany.mockResolvedValue([
            makePlacement({ id: 'ok', targeting: { maxViewsPerSession: 1 } }),
            makePlacement({ id: 'wrong-locale', adapterId: 'baidu' }),
            makePlacement({ id: 'inactive-campaign', campaign: { status: CampaignStatus.PAUSED } }),
            makePlacement({ id: 'future-campaign', campaign: { status: CampaignStatus.ACTIVE, startDate: new Date('2999-01-01') } }),
        ])
        adapterGetMock.mockImplementation((id: string) => {
            if (id === 'baidu') {
                return { supportsLocale: () => false, getPlacementHtml: () => '' }
            }

            return { supportsLocale: () => true, getPlacementHtml: () => '<ins>ad</ins>' }
        })

        const first = await getPlacementsByLocation(AdLocation.HEADER, { locale: 'en-US', sessionId: 'session-1' })
        const second = await getPlacementsByLocation(AdLocation.HEADER, { locale: 'en-US', sessionId: 'session-1' })

        expect(first.map((item) => item.id)).toEqual(['ok'])
        expect(second).toEqual([])
    })

    it('returns campaigns and placements from repositories', async () => {
        campaignRepo.find.mockResolvedValue([{ id: 'campaign-1' }])
        campaignRepo.findOne.mockResolvedValue({ id: 'campaign-2' })
        placementRepo.find.mockResolvedValue([{ id: 'placement-1' }])
        placementRepo.findOne.mockResolvedValue({ id: 'placement-2' })

        await expect(getAllCampaigns()).resolves.toEqual([{ id: 'campaign-1' }])
        await expect(getCampaignById('campaign-2')).resolves.toEqual({ id: 'campaign-2' })
        await expect(getAllPlacements()).resolves.toEqual([{ id: 'placement-1' }])
        await expect(getPlacementById('placement-2')).resolves.toEqual({ id: 'placement-2' })
    })

    it('creates and updates campaigns and placements', async () => {
        campaignRepo.findOne.mockResolvedValue({ id: 'campaign-1', name: 'updated' })
        placementRepo.findOne.mockResolvedValue({ id: 'placement-1', name: 'updated' })

        await expect(createCampaign({ name: 'campaign' })).resolves.toEqual({ name: 'campaign' })
        await expect(createPlacement({ name: 'placement' })).resolves.toEqual({ name: 'placement' })
        await expect(updateCampaign('campaign-1', { name: 'updated' })).resolves.toEqual({ id: 'campaign-1', name: 'updated' })
        await expect(updatePlacement('placement-1', { name: 'updated' })).resolves.toEqual({ id: 'placement-1', name: 'updated' })
        expect(campaignRepo.update).toHaveBeenCalledWith('campaign-1', { name: 'updated' })
        expect(placementRepo.update).toHaveBeenCalledWith('placement-1', { name: 'updated' })
    })

    it('deletes campaigns and placements and supports batch status update', async () => {
        campaignRepo.delete.mockResolvedValue({ affected: 1 })
        placementRepo.delete.mockResolvedValue({ affected: 0 })

        await expect(deleteCampaign('campaign-1')).resolves.toBe(true)
        await expect(deletePlacement('placement-1')).resolves.toBe(false)

        await updatePlacementStatus(['p1', 'p2'], false)

        expect(placementRepo.update).toHaveBeenCalledWith({ id: { $in: ['p1', 'p2'] } }, { enabled: false })
    })

    it('returns placement html only for enabled placements with adapter', async () => {
        placementRepo.findOne
            .mockResolvedValueOnce({ id: 'placement-1', enabled: true, adapterId: 'adsense' })
            .mockResolvedValueOnce({ id: 'placement-2', enabled: false, adapterId: 'adsense' })
            .mockResolvedValueOnce({ id: 'placement-3', enabled: true, adapterId: 'missing' })

        adapterGetMock.mockImplementation((id: string) => {
            if (id === 'adsense') {
                return { getPlacementHtml: () => '<ins>ad</ins>', supportsLocale: () => true }
            }

            return undefined
        })

        await expect(getAdForPlacement('placement-1')).resolves.toBe('<ins>ad</ins>')
        await expect(getAdForPlacement('placement-2')).resolves.toBeNull()
        await expect(getAdForPlacement('placement-3')).resolves.toBeNull()
    })

    it('tracks impressions and click metrics without throwing on repository errors', async () => {
        campaignRepo.findOne.mockResolvedValue({ id: 'campaign-1', clicks: 1, revenue: 2 })

        await expect(recordImpression('campaign-1')).resolves.toBeUndefined()
        await expect(recordClick('campaign-1', 3)).resolves.toBeUndefined()

        expect(campaignRepo.increment).toHaveBeenCalledWith({ id: 'campaign-1' }, 'impressions', 1)
        expect(campaignRepo.save).toHaveBeenCalledWith(expect.objectContaining({ clicks: 2, revenue: 5 }))

        campaignRepo.increment.mockRejectedValueOnce(new Error('db failed'))
        campaignRepo.findOne.mockRejectedValueOnce(new Error('db failed'))

        await expect(recordImpression('campaign-1')).resolves.toBeUndefined()
        await expect(recordClick('campaign-1')).resolves.toBeUndefined()
    })
})
