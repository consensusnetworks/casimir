/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild')

esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    minify: false,
    sourcemap: true,
    platform: 'node',
    target: 'esnext'
})