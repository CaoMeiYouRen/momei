import { defineConfig, devices } from '@playwright/test'

const e2eHost = '127.0.0.1'
const e2ePort = 3001
const e2eBaseURL = `http://${e2eHost}:${e2ePort}`
const e2eAuthSecret = 'lhci-test-secret-0123456789abcdef'
const mobileCriticalSpecPattern = /.*mobile-critical\.e2e\.test\.ts/
// const detectedParallelism = typeof os.availableParallelism === 'function'
//     ? os.availableParallelism()
//     : os.cpus().length
const configuredCiWorkers = Number.parseInt(process.env.PLAYWRIGHT_CI_WORKERS ?? '', 10)
const defaultCiWorkers = 1

let resolvedWorkers: number | undefined
if (Number.isFinite(configuredCiWorkers) && configuredCiWorkers > 0) {
    resolvedWorkers = configuredCiWorkers
} else if (process.env.CI) {
    resolvedWorkers = defaultCiWorkers
} else {
    resolvedWorkers = undefined
}
/** Chromium-specific browser launch flags for CI performance */
// const chromiumLaunchArgs = [
//     '--disable-gpu',
//     '--disable-dev-shm-usage',
//     '--disable-extensions',
//     '--disable-background-timer-throttling',
//     '--disable-backgrounding-occluded-windows',
//     '--disable-renderer-backgrounding',
//     '--no-sandbox',
// ]

const e2eServerEnv = [
    'DEMO_MODE=true',
    'NUXT_PUBLIC_DEMO_MODE=true',
    'TEST_MODE=true',
    'NUXT_PUBLIC_TEST_MODE=true',
    'MOMEI_INSTALLED=true',
    'DISABLE_CRON_JOB=true',
    `HOST=${e2eHost}`,
    `PORT=${e2ePort}`,
    `AUTH_SECRET=${e2eAuthSecret}`,
    `BETTER_AUTH_SECRET=${e2eAuthSecret}`,
    `NUXT_PUBLIC_SITE_URL=${e2eBaseURL}`,
    `NUXT_PUBLIC_AUTH_BASE_URL=${e2eBaseURL}`,
].join(' ')
const e2eServerCommand = `pnpm exec cross-env ${e2eServerEnv} node .output/server/index.mjs`

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './tests/e2e',
    /* Global setup for creating test users */
    globalSetup: './tests/e2e/global-setup.ts',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 1,
    /* Global test timeout — raised for CI where the built server handles multiple concurrent browsers */
    timeout: process.env.CI ? 90000 : 30000,
    /* Keep CI parallelism bounded instead of fully serializing the whole browser matrix. */
    workers: resolvedWorkers,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: process.env.CI
        ? [['github'], ['list'], ['json', { outputFile: 'test-results.json' }]]
        : [['html', { open: 'never' }], ['list']],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions */
    use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: e2eBaseURL,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        /* Capture screenshot on failure */
        // screenshot: 'only-on-failure',
        /* Only record video on failure to reduce IO */
        // video: 'retain-on-failure',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            testIgnore: mobileCriticalSpecPattern,
            use: {
                ...devices['Desktop Chrome'],
                /** Chromium-specific launch args (must NOT be applied to WebKit/Firefox) */
                // launchOptions: { args: chromiumLaunchArgs },
            },
        },

        {
            name: 'firefox',
            testIgnore: mobileCriticalSpecPattern,
            use: { ...devices['Desktop Firefox'] },
        },

        {
            name: 'webkit',
            testIgnore: mobileCriticalSpecPattern,
            use: { ...devices['Desktop Safari'] },
        },

        {
            name: 'mobile-chrome-critical',
            testMatch: mobileCriticalSpecPattern,
            use: {
                ...devices['Pixel 5'],
                /** Chromium-specific launch args (must NOT be applied to WebKit/Firefox) */
                // launchOptions: { args: chromiumLaunchArgs },
            },
        },
        {
            name: 'mobile-safari-critical',
            testMatch: mobileCriticalSpecPattern,
            use: { ...devices['iPhone 12'] },
        },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: e2eServerCommand,
        url: e2eBaseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 600000,
    },
})
