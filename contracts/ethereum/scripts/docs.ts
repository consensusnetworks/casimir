import fs from 'fs'
import { run } from '@casimir/helpers'

void async function () {
    const config = await run('forge config') as string
    const out = config.match(/\[doc\]\nout = "(.*)"/)?.[1] as string
    if (!fs.existsSync(out)) {
        fs.mkdirSync(out, { recursive: true })
    }
    const publicDir = fs.readdirSync('public')
    for (const file of publicDir) {
        fs.copyFileSync(`public/${file}`, `${out}/${file}`)
    }
    let command = 'forge doc'
    if (process.env.SERVE === 'true') {
        command += ' --serve --port=5458'
    }
    run(command)
}()