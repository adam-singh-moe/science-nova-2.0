import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const rootDir = dirname(fileURLToPath(new URL('./package.json', import.meta.url)))

export default defineConfig({
  resolve: {
    alias: {
      '@': rootDir,
    }
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts']
  }
})
