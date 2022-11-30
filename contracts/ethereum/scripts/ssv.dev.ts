import { ethers } from 'hardhat'
import { deployContract } from '@casimir/hardhat-helpers'
import { SSVNetwork, SSVRegistry, SSVToken } from '../build/artifacts/types'

void async function () {
  const [ owner ] = await ethers.getSigners()

  const contracts = {
    SSVRegistry: {
      address: '',
      args: {},
      options: {
        initializer: false
      },
      proxy: true
    },
    SSVToken: {
      address: '',
      args: {},
      options: {},
      proxy: false
    },
    SSVNetwork: {
      address: '',
      args: {
        SSVRegistry: '',
        SSVToken: '',
        MinimumBlocksBeforeLiquidation: 100,
        OperatorMaxFeeIncrease: 3,
        DeclareOperatorFeePeriod: 0,
        ExecuteOperatorFeePeriod: 86400
      },
      options: {},
      proxy: true
    },
    SSVManager: {
      address: '',
      args: {},
      options: {},
      proxy: false
    }
  }

  for (const name in contracts) {
    // Update SSVRegistry and SSVToken for SSVNetwork deployment
    if (name === 'SSVNetwork') {
      contracts['SSVNetwork']['args']['SSVRegistry'] = contracts['SSVRegistry']['address']
      contracts['SSVNetwork']['args']['SSVToken'] = contracts['SSVToken']['address']
    }

    console.log(`Deploying ${name} contract...`)
    const { args, options, proxy } = contracts[name as keyof typeof contracts]
    const { address } = await deployContract(name, proxy, args, options)
    console.log(`${name} contract deployed to ${address}`)

    // Save contract address
    contracts[name as keyof typeof contracts]['address'] = address
  }

  const WETH9 = await deployContract('WETH9')
  console.log('WETH9_ADDRESS', WETH9.address)
  const SSVRegistry = await ethers.getContractAt('SSVRegistry', contracts['SSVRegistry']['address']) as SSVRegistry
  const SSVToken = await ethers.getContractAt('SSVToken', contracts['SSVToken']['address']) as SSVToken
  const SSVNetwork = await ethers.getContractAt('SSVNetwork', contracts['SSVNetwork']['address']) as SSVNetwork

  const mintTransaction = await SSVToken.mint(owner.address, '1000000000000000000000')
  await mintTransaction.wait()
  const balance = await SSVToken.balanceOf(owner.address)
  console.log('Sent 1000 SSV to', owner.address)
  console.log(owner.address, 'balance is now', ethers.utils.formatUnits(balance), 'SSV')

  const operators = [
      {
          name: 'R2-D2',
          publicKey: 'LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBN21GYnZzYm5BMUdyRDZTa01tSFEKYmN4OU9hU3UvOGExbFhOZ3Q4R3VGVVJTSWlldzk4ZTZiWm9NenBlZXlZV3dJUHphVE1MWnUyajFlbnlYSXBZKworMS9Gb1ZCRktaQWJ6S3d6TnBhZStuTmRiYWdTUks1UjJKbU9uWmFqWnE2V2ZJNkxsaUhGY2F2Y3UraGFrcGpMCm9Yd0ZwTmtQb2NPV3JzdWVGeDFHZEg1UXZ3Vzd0cUlMSUoxWTFMTHYwbzI2TUdFSlF4UGhpYW1pRDdiYWtLSm0KRnl4NFlsdDBudzR1MVJFRFFiUTUyanRuMU9tUWxKTkd4c2V0aVpxRUpYOG5zam1xcWIvMUdpbk9GWTl2ZDlKWAplOUh1c2RYcDRGR093ek9NajZYNVhVK2dYVUU5Tml0RVZWcnVEWDhKSTJkUHJOM1ltNmp1RWZNU01CcExxQzlPCjNRSURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K',
          fee: '200000000000'
      },
      {
          name: 'C-3PO',
          publicKey: 'LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBd3FsalgxWkQ2dXBFSy9rWnEzcjgKdStGRlk1TUxBcmYzeU1rU1JxcGhlelRESEg4NEJZL0o5eWpnV0dudndVSXFFaEY4RVFvVGg0UnViR3lhV2pXQwpOQ1lmWFdwdlo5WCtCbWd5MDlhVjdaMHVzTlZqUG5JTElFRC9wNzJZWCtpck9yaWV0TmszeUloUXU5VDNmYWhXCndxQ2xNY2tRdHR3NjBYWkZGWW9DT0xuSTljZzkvRlM0S3RLNm1wc011MFpUNHVIbUljR2R6dm4waGxFaGtaOEoKdzhBeWkrcGRMV2g3NWY3Q0FuL1hKVmdUaTRBNEF4L2ExaUs2Y3VDT1UrTlk1MWx6RFBqYTk2NTc0aHc3bThhVApucHpqSXZjdGFVV25qT3p0Y21EQzRsZDJVcW9XeW0xcmFUWUpwMjJGVFNqbDJpRHdRbTk5MU5jSTFLZUdUekNHCnV3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K',
          fee: '400000000000'
      },
      {
          name: 'AP-5',
          publicKey: 'LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBcEV5TnZVbWg5NjM4M2h4alJkQjkKcjd5NEttb0ZSZGtDOGVJU2Q1YW5YTFd5YlFjQW8zUTc2VWlnelo1TU1ONUhKanVHV3lhL3M3bXJTVTNGZnBNcgpvSkd2VDYvNC9hU0FqNmQ3WFBIRTUrdnoxYW5UYTJza2pqTTJjS3c2b1g3SlIxMDk0eHZFN2NCK29JUC9EUkJBCmswdzdqOW90OGFrY1FwTWdYMXQyVi9lVlNJamhIek5QTThnTTBkam1qODhuQk9xLzVoOXBPS05SWXEwTFk2ZkcKenZpYkhaMXJVU01udXNOUldPcGJtMWszZVJlYVJ4a1Vza3hYQXVCenFvWHM5SnIxNE9yVFQ3SFpLQk1WUTkrZwpaM0Z1YjVpc1dLS0lhWUgySmhZNEdRWHpDcHpncTV2bEZrSUxXM2hVY0RGcWM4cEUzMEFKTmRyQWg2cFgwUk1ZCnl3SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K',
          fee: '600000000000'
      },
      {
          name: 'BD-1',
          publicKey: 'LS0tLS1CRUdJTiBSU0EgUFVCTElDIEtFWS0tLS0tCk1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBeTVleXZ0WjJEeDFnQ3lGbTFoZFEKVGFZb2F5SG1GVDhXdVR4bDkrRkZtVFVDVUt6b0pnNFBiUUl0WXk1WEhYMXVXNTNZdG5jVzFqQ0JNMk9MQzYvbgpMWUNaaC8wdTE0aXJYcVJZMWYvNTY2V05CYkR5ek5IT0FHdjgrNHRhNXUvbkVyMitpUy9UWGNVSWxCTTNTSlNICmlUcmtjQUROZXFXbExuRTM2LzNkbjRmWXM2bG5rVGtzV3YxL1BNR1VBNTFLVWYySGFzWnVXRzVpVVRNVEdNL3MKS2RaY2RMYml4VS9vNVZMTlNPOUpZR09lSkxJellSR1hHTTFSUWorMGdhYW11bFpKZUp3akp3dzVHb0RNRWwzMgpvOS8yLy9PQlBSQmJ0QnVlblZRTVV1L3NZbmdHbkt0cElIZ3VRdXJEWCtkeEtUSWlTVlIxekl3ODVWOThZekNYCm13SURBUUFCCi0tLS0tRU5EIFJTQSBQVUJMSUMgS0VZLS0tLS0K',
          fee: '800000000000'
      }
  ]

  for (const { name, publicKey, fee } of operators) {
      const publicKeyBytes = ethers.utils.toUtf8Bytes(publicKey)
      const registerTransaction = await SSVNetwork.registerOperator(name, publicKeyBytes, fee, { from: owner.address })
      await registerTransaction.wait()
      console.log('Registered', name, 'with the key', publicKey)
  }

  const operatorIds = await SSVRegistry.getOperatorsByOwnerAddress(owner.address)
  for (const id of operatorIds) {
      const operatorId = ethers.BigNumber.from(id)
      const operator = await SSVRegistry.getOperatorById(operatorId)
      console.log('Operator', id, 'is registered as', operator)
  }

  process.exit(0)
}()