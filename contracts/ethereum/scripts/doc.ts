import fs from 'fs'
import { run } from '@casimir/helpers'

void async function () {
    const config = await run('forge config') as string
    const outDir = config.match(/\[doc\]\nout = "(.*)"/)?.[1] as string
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true })
    }
    const publicDir = fs.readdirSync('public')
    for (const file of publicDir) {
        fs.copyFileSync(`public/${file}`, `${outDir}/${file}`)
    }
    let command = 'forge doc'
    if (process.env.SERVE === 'true') {
        command += ' --serve --port=5458'
    }
    await run(command)
}()