import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/production',
    use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:4174',
        serviceWorkers: 'block',
        launchOptions: { args: ['--enable-unsafe-swiftshader'] },
    },
    webServer: {
        command: 'npm run build -- --outDir ../.playwright/production-dist && npm run preview -- --outDir ../.playwright/production-dist --host 127.0.0.1 --port 4174 --strictPort',
        url: 'http://127.0.0.1:4174',
        // Keep the build with a fake key separate from deployable dist output.
        env: { VITE_OPENROUTESERVICE_API_KEY: 'route-rendering-test' },
        reuseExistingServer: false,
        timeout: 60_000,
    },
});
