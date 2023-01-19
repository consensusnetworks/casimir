import vue from '@vitejs/plugin-vue'
import { UserConfig } from 'vite'
import { fileURLToPath } from 'url'
import * as path from 'path'
import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill'
import inject from '@rollup/plugin-inject'
import nodePolyFills from 'rollup-plugin-node-polyfills'

export default {
  server: { port: 3000 },
  resolve: {
    alias: {  
      // Polyfill node globals
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',

      // Alias internal src paths
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src')
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
  plugins: [
    vue({ include: [/\.vue$/] }),
    inject({
      Buffer: ['buffer', 'Buffer']
    }),
    nodePolyFills()
  ],
  define: {
    'global': 'globalThis'
  },
  optimizeDeps: {
    include: ['iotex-antenna'],
    esbuildOptions: {
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true
        })
      ]
    },
  },
  build: {
    commonjsOptions: {
      include: [/iotex-antenna/, /node_modules/]
    }
  },
  envPrefix: 'PUBLIC_'
} as UserConfig