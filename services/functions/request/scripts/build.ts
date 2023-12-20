import { bundle } from "https://deno.land/x/emit@0.32.0/mod.ts"

async function main() {
    const inputDir = "./request/src"
    const outputDir = "./request/dist"
    
    const { code } = await bundle(`${inputDir}/index.ts`)
    await Deno.mkdir(outputDir, { recursive: true })
    await Deno.writeTextFile(`${outputDir}/index.js`, code)
}

main().catch(error => {
    console.error(error)
    Deno.exit(1)
})