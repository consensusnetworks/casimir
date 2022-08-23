import vue from '@vitejs/plugin-vue'
import { Plugin, UserConfig } from 'vite'
import { fileURLToPath } from 'url'
import * as path from 'path'
import pages from 'vite-plugin-pages'
import inject from '@rollup/plugin-inject'

const config: UserConfig = {
  plugins: [
    vue({ include: [/\.vue$/, /\.md$/] }),
    pages({
      dirs: [{ dir: 'src/pages', baseRoute: '' }],
      extensions: ['vue', 'md'],
    }),
    inject({
      Buffer: ['buffer', 'Buffer']
    }) as Plugin // https://github.com/rollup/plugins/issues/1243
  ],
  define: {
    'global': {}
  },
  optimizeDeps: {
    include: [
      'buffer',
      'borsh'
    ]
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/bn.js/, /js-sha3/, /hash.js/, /aes-js/, /scrypt/, /bech32/, /iotex-antenna/, /iotex-antenna\/lib\/plugin\/ws/]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
      './runtimeConfig': './runtimeConfig.browser'
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue']
  },
  envPrefix: 'PUBLIC_',
}

export default config
