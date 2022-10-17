import defaultConfig from '@casimir/ethereum/hardhat.config'
import { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = { 
    ...defaultConfig,
    paths: {
        tests: './test'
    }
}

export default config