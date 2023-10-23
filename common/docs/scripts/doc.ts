import fs from 'fs'
import { run } from '@casimir/shell'

void async function () {
    const cargo = await run('which cargo') as string
    if (!cargo || cargo.includes('not found')) {
        throw new Error('🚩 Please install rust (see https://www.rust-lang.org/tools/install)')
    }

    const mdbookKatex = await run('cargo install --list | grep mdbook-katex') as string
    if (!mdbookKatex) {
        await run('cargo install mdbook-katex')
    }

    const mdbookMermaid = await run('cargo install --list | grep mdbook-mermaid') as string
    if (!mdbookMermaid) {
        await run('cargo install mdbook-mermaid')
    }

    // const config = await run('forge config') as string

    // const outDir = config.match(/\[doc\]\nout = "(.*)"/)?.[1] as string
    // if (!fs.existsSync(outDir)) {
    //     fs.mkdirSync(outDir, { recursive: true })
    // }

    // const publicDir = fs.readdirSync('public')
    // for (const file of publicDir) {
    //     fs.copyFileSync(`public/${file}`, `${outDir}/${file}`)
    // }

    // await run('forge doc')
}()