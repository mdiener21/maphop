import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'jsdom',
        include: ['tests/unit/**/*.test.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['src/js/**/*.js'],
            exclude: ['src/js/temp.js', 'src/js/tiles.json'],
        },
    },
});
