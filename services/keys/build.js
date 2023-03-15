/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild')

esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: 'node',
    target: 'esnext',
    external: ['pg-native']
})