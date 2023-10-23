import { run } from '@casimir/shell'

void async function () {
    const referenceDir = `${process.cwd()}/src/reference`
    const solidityTemplatesDir = `${process.cwd()}/templates/solidity`
    await run(`DOCS_OUTPUT_DIR=${referenceDir} DOCS_TEMPLATE_DIR=${solidityTemplatesDir} npm run generate --workspace @casimir/ethereum`)
}()