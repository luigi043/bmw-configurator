import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // Split the heavy 3D libraries into their own chunk so the UI shell
        // can paint before the WebGL bundle is parsed.
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    // Playwright specs live in /e2e and are run by their own runner.
    exclude: ['e2e/**', 'node_modules/**'],
  },
});
