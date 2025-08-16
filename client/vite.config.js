import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    build: {
        minify: false
    },
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://localhost:8080/',
                changeOrigin: true,
                rewrite: path => path.replace(/^\/api/, '')
            },
            '/bootstrap.min.css': {
                target: 'http://localhost:8080/',
                changeOrigin: true
            }
        }

    },
    define: {
        'global': {},
        '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
    },
})
