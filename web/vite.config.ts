import solid from '@solidjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tanstackRouter({
            target: 'solid',
            autoCodeSplitting: true,
        }),
        solid(),
        Icons({ compiler: 'solid' }),
        tailwindcss(),
    ],
    resolve: {
        tsconfigPaths: true,
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
            },
        },
    },
});
