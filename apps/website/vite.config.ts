import vue from '@vitejs/plugin-vue'
import { UserConfig } from 'vite'
import { fileURLToPath } from 'url'
import * as path from 'path'
import pages from 'vite-plugin-pages'
import inject from '@rollup/plugin-inject'
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
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        NodeModulesPolyfills(),
        NodeGlobalsPolyfillPlugin({
          process: true,
          define: true,
        }),
      ],
    },
    include: ['iotex-antenna'],
  },
  build: {
    commonjsOptions: {
      include: [/iotex-antenna/, /node_modules/],
    },
    rollupOptions: {
      plugins: [
        inject({
          Buffer: ['buffer', 'Buffer'],
        }),
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
      './runtimeConfig': './runtimeConfig.browser',
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  envPrefix: 'PUBLIC_',
}

export default config
