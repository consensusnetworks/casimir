import vue from '@vitejs/plugin-vue'
import { UserConfig } from 'vite'
import { fileURLToPath } from 'url'
import * as path from 'path'
import pages from 'vite-plugin-pages'

import NodeModulesPolyfills from '@esbuild-plugins/node-modules-polyfill'
import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill'

const config: UserConfig = {
  plugins: [
    vue({ include: [/\.vue$/, /\.md$/] }),
    pages({
      dirs: [{ dir: 'src/pages', baseRoute: '' }],
      extensions: ['vue', 'md'],
    }),
  ],
  define: {
    'window.global': [],
  },
  optimizeDeps: {
    include: ['iotex-antenna'],
    esbuildOptions: {
      plugins: [
        NodeModulesPolyfills(),
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
          define: true,
        }),
      ],
    },
  },
  build: {
    commonjsOptions: {
      include: [/iotex-antenna/, /node_modules/]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
      './runtimeConfig': './runtimeConfig.browser',
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ]
  },
  envPrefix: 'PUBLIC_'
}

export default config
