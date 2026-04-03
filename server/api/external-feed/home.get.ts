import { mapAuthLocaleToAppLocale, detectRequestAuthLocale } from '~/server/utils/locale'
import { success } from '@/server/utils/response'
import { getExternalFeedHomePayload } from '@/server/services/external-feed/aggregator'

export default defineEventHandler(async (event) => {
    const requestedLocale = mapAuthLocaleToAppLocale(detectRequestAuthLocale(event))
    const data = await getExternalFeedHomePayload(requestedLocale)

    return success(data)
})
