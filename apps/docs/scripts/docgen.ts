import { run } from '@casimir/shell'

void async function () {
    const outputDir = `${process.cwd()}/src/reference`
    const templateDir = `${process.cwd()}/templates/solidity`
    await run(`DOCS_OUTPUT_DIR=${outputDir} DOCS_TEMPLATE_DIR=${templateDir} npm run docgen --workspace @casimir/ethereum`)
}()