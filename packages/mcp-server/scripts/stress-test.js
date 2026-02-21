#!/usr/bin/env node
import { parseArgs } from 'node:util'

/**
 * Standalone Momei API Stress Test Script
 * This script is standalone and doesn't rely on local module imports.
 * It's perfect for testing against different environments.
 */

class MomeiApi {
    constructor(config) {
        this.config = config
    }

    async request(path, options = {}) {
        const url = `${this.config.apiUrl}${path}`
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.config.apiKey,
                ...options.headers,
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API Error (${response.status} ${response.statusText}): ${errorText}`)
        }

        return response.json()
    }

    async listPosts(query = {}) {
        const searchParams = new URLSearchParams()
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
            }
        })
        const queryString = searchParams.toString()
        return this.request(`/api/external/posts${queryString ? `?${queryString}` : ''}`)
    }

    async getPost(id) {
        return this.request(`/api/external/posts/${id}`)
    }
}

async function stressTest() {
    const { values } = parseArgs({
        options: {
            url: { type: 'string', short: 'u', default: 'http://localhost:3000' },
            key: { type: 'string', short: 'k' },
            requests: { type: 'string', short: 'n', default: '1000' },
            concurrency: { type: 'string', short: 'c', default: '10' },
            type: { type: 'string', short: 't', default: 'list' }, // list, get
        },
    })

    const { url, key, requests, concurrency, type } = values
    const numRequests = parseInt(requests)
    const numConcurrency = parseInt(concurrency)

    if (!key) {
        console.error('Error: MOMEI_API_KEY is required for stress test.')
        process.exit(1)
    }

    const api = new MomeiApi({
        apiUrl: url,
        apiKey: key,
    })

    console.log(`🚀 Starting Stress Test against: ${url}`)
    console.log(`📊 Parameters: ${requests} requests, ${concurrency} concurrency, type: ${type}\n`)

    const start = Date.now()
    let completed = 0
    let errors = 0
    let results = []

    const worker = async () => {
        while (completed < numRequests) {
            const currentIdx = completed++
            if (currentIdx >= numRequests) break

            const requestStart = Date.now()
            try {
                if (type === 'list') {
                    await api.listPosts({ page: 1, limit: 10 })
                } else {
                    await api.getPost('any-id')
                }
                const duration = Date.now() - requestStart
                results.push(duration)
            } catch (err) {
                errors++
            }
        }
    }

    const workers = Array.from({ length: numConcurrency }, () => worker())
    await Promise.all(workers)

    const totalTime = Date.now() - start
    const rps = (numRequests / (totalTime / 1000)).toFixed(2)
    const avgRt = (results.reduce((a, b) => a + b, 0) / results.length || 0).toFixed(2)
    const sorted = results.sort((a, b) => a - b)
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0

    console.log('✅ Stress Test Finished')
    console.log('---------------------------')
    console.log(`Total Time: ${totalTime} ms`)
    console.log(`Success: ${numRequests - errors}`)
    console.log(`Errors: ${errors}`)
    console.log(`RPS: ${rps}`)
    console.log(`Avg RT: ${avgRt} ms`)
    console.log(`P95 RT: ${p95} ms`)
    console.log(`P99 RT: ${p99} ms`)
    console.log('---------------------------')
}

stressTest().catch(console.error)
