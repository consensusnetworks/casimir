import vue from '@vitejs/plugin-vue'
import { UserConfig } from 'vite'
import { fileURLToPath } from 'url'
import * as path from 'path'
import pages from 'vite-plugin-pages'
import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill'
import inject from '@rollup/plugin-inject'

const config: UserConfig = {
  plugins: [
    vue({ include: [/\.vue$/] }),
    pages({
      dirs: [{ dir: 'src/pages', baseRoute: '' }],
      extensions: ['vue'],
    }),
    inject({
      Buffer: ['buffer', 'Buffer']
    }) as Plugin // https://github.com/rollup/plugins/issues/1243
  ],
  define: {
    'global': 'globalThis'
  },
  optimizeDeps: {
    // include: ['iotex-antenna'],
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true
        })
      ],
    },
  },
  build: {
    commonjsOptions: {
      include: [/* /iotex-antenna/, */ /node_modules/]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
      './runtimeConfig': './runtimeConfig.browser'
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
