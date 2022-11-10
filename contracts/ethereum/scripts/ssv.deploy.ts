import { deployContract } from '@casimir/hardhat-helpers'

async function main() {
  
  process.env.MINIMUM_BLOCKS_BEFORE_LIQUIDATION = '100'
  process.env.OPERATOR_MAX_FEE_INCREASE = '3'
  process.env.SET_OPERATOR_FEE_PERIOD = '259200' // 3 days
  process.env.APPROVE_OPERATOR_FEE_PERIOD = '345600' // 4 days
  process.env.VALIDATORS_PER_OPERATOR_LIMIT = '2000'
  process.env.REGISTERED_OPERATORS_PER_ACCOUNT_LIMIT = '10'
  process.env.DECLARE_OPERATOR_FEE_PERIOD = '0'
  process.env.EXECUTE_OPERATOR_FEE_PERIOD = '86400'

  const ssvContractNames = ['SSVRegistry', 'SSVToken', 'SSVNetwork', 'SSVManager']

  for (const name of ssvContractNames) {
    console.log(`Deploying ${name} contract...`)
    const { address } = await deployContract(name)
    process.env[`${name.toUpperCase()}_ADDRESS`] = address
    console.log(`${name} contract deployed to ${address}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })