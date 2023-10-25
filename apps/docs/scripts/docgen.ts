import fs from 'fs'
import { run } from '@casimir/shell'

void async function () {
    const referenceDir = `${process.cwd()}/src/reference`
    const solidityTemplateDir = `${process.cwd()}/templates/solidity`
    await run(`DOCS_OUTPUT_DIR=${referenceDir} DOCS_TEMPLATE_DIR=${solidityTemplateDir} npm run docgen --workspace @casimir/ethereum`)
    
    const casimirOperatorReadmeUrl = 'https://raw.githubusercontent.com/consensusnetworks/casimir-operator/master/README.md'
    const casimirOperatorReadme = await fetch(casimirOperatorReadmeUrl)
    const casimirOperatorReadmeText = await casimirOperatorReadme.text()
    
    const partsDir = `${process.cwd()}/src/parts`
    if (!fs.existsSync(partsDir)) fs.mkdirSync(partsDir)
    fs.writeFileSync(`${partsDir}/casimir-operator-README.md`, casimirOperatorReadmeText)
}()