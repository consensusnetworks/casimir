import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import * as path from 'path'
import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill'
import inject from '@rollup/plugin-inject'
import nodePolyFills from 'rollup-plugin-node-polyfills'

export default defineConfig({
  server: { port: 3001 },
  plugins: [
    vue({ include: [/\.vue$/] }),
    nodePolyFills(),
    inject({
      Buffer: ['buffer', 'Buffer']
    }) as Plugin // https://github.com/rollup/plugins/issues/1243
  ],
  define: {
    'global': 'globalThis'
  },
  optimizeDeps: {
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
      include: [/node_modules/]
    }
  },
  resolve: {
    alias: {  
      // Polyfill node globals
      stream: 'rollup-plugin-node-polyfills/polyfills/stream',
      crypto: 'crypto-browserify',

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
  envPrefix: 'PUBLIC_'
})