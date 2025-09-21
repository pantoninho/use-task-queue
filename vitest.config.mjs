import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environmentMatchGlobs: [['tests/use-task-queue.test.jsx', 'jsdom']],
        coverage: {
            reporter: ['text', 'lcov'],
            reportsDirectory: './coverage',
            include: ['src/**'] 
        },
    },
});
