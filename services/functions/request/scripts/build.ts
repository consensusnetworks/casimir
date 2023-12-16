import { bundle } from "https://deno.land/x/emit@0.32.0/mod.ts"

const url = new URL("./request/src/index.ts", import.meta.url)
const result = await bundle(url)
const { code } = result
await Deno.writeTextFile("./request/dist/index.js", code)