"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="vitest" />
const vite_1 = require("vite");
exports.default = (0, vite_1.defineConfig)({
    test: {
        globals: true,
        environment: 'node',
        // Run a global setup once per test run (avoids running DB reset concurrently in workers)
        globalSetup: './src/test/global-setup.ts',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                'dist/'
            ],
        },
    },
});
