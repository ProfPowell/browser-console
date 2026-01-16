import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/browser-console.js',
      formats: ['es'],
      fileName: () => 'browser-console.js'
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  },
  server: {
    open: '/docs/index.html'
  }
})