/* eslint-disable @typescript-eslint/no-var-requires */
const esbuild = require('esbuild')
const { spawn } = require('child_process')

const esbuildArgs = process.argv.slice(2)
const shouldWatch = esbuildArgs.includes('--watch')

esbuild.build({
    entryPoints: ['src/index.ts'],
    outfile: 'dist/index.js',
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: 'node',
    target: 'esnext',
    watch: shouldWatch ? {
        onRebuild(error, result) {
            if (error) console.error('Watch build failed', error)
            else {
                console.log('Watch build succeeded', result)
                spawn('npm', ['run', 'cdk:synth', '--workspace', '@casimir/cdk'], { stdio: 'inherit' })
            }
        }
    } : false
}).then(buildResult => {
    console.log('Build succeeded', buildResult)
})