import tanstackRouter from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tanstackRouter({
            autoCodeSplitting: true,
        }),
        tsconfigPaths(),
        react(),
        tailwindcss(),
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
            },
        },
    },
});
