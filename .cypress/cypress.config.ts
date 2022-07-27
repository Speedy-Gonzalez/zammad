import { defineConfig } from 'cypress'
import { addMatchImageSnapshotPlugin } from 'cypress-image-snapshot/plugin'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import pkg from '../package.json'

const isCI = !!process.env.CI
const root = resolve(__dirname, '..')

export default defineConfig({
  videosFolder: '.cypress/videos',
  supportFolder: '.cypress/support/index.js',
  fixturesFolder: '.cypress/fixtures',
  downloadsFolder: '.cypress/downloads',
  screenshotsFolder: '.cypress/screenshots',
  videoCompression: false,
  component: {
    supportFile: '.cypress/support/index.js',
    setupNodeEvents(on, config) {
      on('after:spec', (spec, results) => {
        if (results && results.stats.failures === 0 && results.video) {
          return rm(results.video)
        }
      })
      addMatchImageSnapshotPlugin(on, config)
    },
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      viteConfig: {
        mode: 'cypress',
        root,
        configFile: resolve(__dirname, '..', 'vite.config.ts'),
        cacheDir: resolve(__dirname, 'node_modules', '.vite'),
        server: {
          fs: {
            strict: false,
          },
          hmr: !isCI,
        },
        optimizeDeps: {
          entries: [
            '**/cypress/**/*.cy.ts',
            '!**/node_modules/**',
            '!**/*.d.ts',
          ],
          include: [
            'flatpickr',
            '@vueuse/core',
            '@formkit/core',
            'tippy.js',
            'prosemirror-state',
            'vue3-draggable-resizable',
            ...Object.keys(pkg.dependencies).filter((name) =>
              name.startsWith('@tiptap'),
            ),
          ],
        },
      },
    },
    // iPhone 12 viewport
    viewportWidth: 390,
    viewportHeight: 844,
    fileServerFolder: '..',
    indexHtmlFile: '.cypress/support/component-index.html',
    specPattern: ['**/frontend/**/*.cy.{js,jsx,ts,tsx}'],
  },
  retries: {
    runMode: 2,
    openMode: 0,
  },
})
