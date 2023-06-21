// Functions: Handle requests for validator balances (total active balance and total swept balance) and pool validator details (activated deposits, forced exits, completed exits, and compoundable pool IDs)
// Config: Expose a combination of preset and dynamic Functions config:
//     - Preset args: CasimirViews contract address (obtained after initial deployment), method signatures (`getDepositedPoolCount()`, `getPoolPublicKeys(uint256 startIndex, uint256 endIndex)`, `getSweptBalance(uint256 startIndex, uint256 endIndex)`, and `getCompoundablePoolIds()`)
//     - Dynamic args: previous report block number, report block number, request type (balances or details)
//     - Secrets: complete archive node (execution and consensus) provider URLs (preferably split evenly across DON)
// Balances handler: report validator total active balance and total swept balance
//     1. Obtain CasimirViews contract address, method signatures, previous report block number, report block number, and request type from args
//     2. Select balances handler (for request type 1)
//     3. Get deposited (pending or staked) pool count at report block number from CasimirViews (1 request)
//     4. Get validator public keys at the report block number from CasimirViews (1 request, with max pool count batch size for additional requests)
//     5. Get Beacon validator balances at report block number from Beacon API (1 request)
//     6. Sum Beacon validator balances to obtain the total active balance
//     7. Get swept balance at the report block number from CasimirViews (1 request, with max pool count batch size for additional requests)
//     8. Sum swept balances to obtain total swept balance
//     9. Encode uint128(active balance) and uint128(swept balance)
//     10. Return single response bytes
// Details handler: report validator activated deposits, forced exits, completed exits, and compoundable pool IDs
//     1. Obtain CasimirViews contract address, method signatures, report block number, and request type from args
//     2. Select details handler (for request type 2)
//     3. Get deposited (pending or staked) pool count at report block number from CasimirViews (1 request)
//     4. Get validator public keys at the report block number from CasimirViews (1 request, with max pool count batch size for additional requests)
//     5. Get Beacon validators at report block number from Beacon API (1 request)
//     6. Sum activated deposits within the reporting period (between the report and previous report block numbers) to obtain activated deposits
//     7. Sum forced exits within the reporting period (between the report and the previous report block numbers) to obtain forced exits
//     8. Sum completed exits (with withdrawal_done status) to obtain completed exits
//     9. Get compoundable pool IDs from CasimirViews (1 request)
//     10. Encode uint32(activated deposits), uint32(forced exits), uint32(completed exits), and uint32[5](compoundable pool IDs)
//     11. Return single response bytes

const previousReportBlock = '0x' + parseInt(args[0]).toString(16)
const reportBlock = '0x' + parseInt(args[1]).toString(16)
const requestType = args[2]
const viewsAddress = args[3]
const getCompoundablePoolIds = args[4]
const getDepositedPoolCount = args[5]
const getSweptBalance = args[6]
const getValidatorPublicKeys = args[7]

const url = secrets.ethereumApiUrl

switch (requestType) {
	case '1':
		return await balancesHandler()
	case '2':
		return await detailsHandler()
	default:
		return Buffer.from('Invalid request type')
}

async function balancesHandler() {
	const depositedPoolCountRequest = await Functions.makeHttpRequest({
		url: 'http://localhost:8545',
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					// The signature of 'getDepositedPoolCount()'
					data: getDepositedPoolCount
				},
				{ blockNumber: reportBlock }
			]
		}
	})

	if (depositedPoolCountRequest.error) {
		return depositedPoolCountRequest.error
	}
	
	const depositedPoolCount = Number(depositedPoolCountRequest.data.result)

	const startIndex = BigInt(0).toString(16).padStart(64, '0')
	const endIndex = BigInt(depositedPoolCount).toString(16).padStart(64, '0')
	console.log('startIndex', startIndex)
	console.log('endIndex', endIndex)

	const validatorPublicKeysRequest = await Functions.makeHttpRequest({
		url: 'http://localhost:8545',
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					// The signature of 'getValidatorPublicKeys(uint256,uint256)' with startIndex = 0 and endIndex = depositedPoolCount
					data: getValidatorPublicKeys + startIndex + endIndex
				},
				{ blockNumber: reportBlock }
			]
		}
	})

	if (validatorPublicKeysRequest.error) {
		return validatorPublicKeysRequest.error
	}

	const validatorPublicKeysResponse = validatorPublicKeysRequest.data.result.slice(2)
	let offset = parseInt(validatorPublicKeysResponse.slice(128, 192), 16) * 2
	let length = parseInt(validatorPublicKeysResponse.slice(192, 256), 16) * 2
	const validatorPublicKeys = []
	for (let i = 0; i < length; i++) {
		let start = offset + i * 96
		let end = start + 96
		let publicKey = '0x' + validatorPublicKeysResponse.slice(start, end)
		validatorPublicKeys.push(publicKey)
	}

	console.log('validatorPublicKeys', validatorPublicKeys)

	const validatorsRequest = await Functions.makeHttpRequest({
		url: `${url}/eth/v1/beacon/states/finalized/validators?id=${validatorPublicKeys.join(',')}`
	})

	if (validatorsRequest.error) {
		return validatorsRequest.error
	}

	let activeBalance = 0
	for (const { balance } of validatorsRequest.data.data) {
		activeBalance += parseFloat(balance)
	}

	const sweptBalanceRequest = await Functions.makeHttpRequest({
		url: 'http://localhost:8545',
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					// The signature of 'getSweptBalance(uint256,uint256)' with startIndex = 0 and endIndex = depositedPoolCountRequest
					data: getSweptBalance + '0'.repeat(24) + Functions.encodeUint256(0).slice(2) + Functions.encodeUint256(depositedPoolCountRequest.data).slice(2)
				},
				{ blockNumber: reportBlock }
			]
		}
	})

	if (sweptBalanceRequest.error) {
		return sweptBalanceRequest.error
	}

	console.log('sweptBalanceRequest.data', sweptBalanceRequest.data)
	const sweptBalance = parseFloat(sweptBalanceRequest.data.slice(0, -9))

	const response = Buffer.concat([
		encodeUint128(activeBalance),
		encodeUint128(sweptBalance)
	])

	return response
}

async function detailsHandler() {
	const depositedPoolCountRequest = await Functions.makeHttpRequest({
		url: 'http://localhost:8545',
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					// The signature of 'getDepositedPoolCount()'
					data: getDepositedPoolCount
				},
				{ blockNumber: reportBlock }
			]
		}
	})

	if (depositedPoolCountRequest.error) {
		return depositedPoolCountRequest.error
	}

	const validatorPublicKeysRequest = await Functions.makeHttpRequest({
		url: 'http://localhost:8545',
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					// The signature of 'getValidatorPublicKeys(uint256,uint256)' with startIndex = 0 and endIndex = depositedPoolCountRequest.data
					data: getValidatorPublicKeys + '0'.repeat(24) + Functions.encodeUint256(0).slice(2) + Functions.encodeUint256(depositedPoolCountRequest.data).slice(2)
				},
				{ blockNumber: reportBlock }
			]
		}
	})

	if (validatorPublicKeysRequest.error) {
		return validatorPublicKeysRequest.error
	}

	const validatorsRequest = await Functions.makeHttpRequest({
		url: `${url}/eth/v1/beacon/states/finalized/validators?id=${validatorPublicKeysRequest.data.join(',')}`
	})

	if (validatorsRequest.error) {
		return validatorsRequest.error
	}

	const activatedDeposits = validatorsRequest.data.data.reduce((accumulator, { activation_epoch, status }) => {
		if (status.includes('active') && activation_epoch >= previousReportBlock && activation_epoch < reportBlock) {
			accumulator += 1
		}
		return accumulator
	}, 0)

	const forcedExits = validatorsRequest.data.data.reduce((accumulator, { exit_epoch, status }) => {
		if (status.includes('exiting') && exit_epoch >= previousReportBlock && exit_epoch < reportBlock) {
			accumulator += 1
		}
		return accumulator
	}, 0)

	if (forcedExits.error) {
		return forcedExits.error
	}

	const completedExits = validatorsRequest.data.data.reduce((accumulator, { exit_epoch, status }) => {
		if (status === 'withdrawal_done' && exit_epoch >= previousReportBlock && exit_epoch < reportBlock) {
			accumulator += 1
		}
		return accumulator
	}, 0)

	if (completedExits.error) {
		return completedExits.error
	}

	const compoundablePoolIdsRequest = await Functions.makeHttpRequest({
		url: 'http://localhost:8545',
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					// The signature of 'getCompoundablePoolIds()'
					data: getCompoundablePoolIds // + '0'.repeat(24)
				},
				{ blockNumber: reportBlock }
			]
		}
	})

	if (compoundablePoolIdsRequest.error) {
		return compoundablePoolIdsRequest.error
	}

	const compoundablePoolIds = compoundablePoolIdsRequest.data

	const response = Buffer.concat([
		encodeUint32(activatedDeposits),
		encodeUint32(forcedExits),
		encodeUint32(completedExits),
		encodeUint32Array(compoundablePoolIds)
	])

	return response
}

function encodeUint128(value) {
	const buffer = Buffer.alloc(16)
	buffer.writeBigUInt64BE(BigInt(value))
	return buffer
}

function encodeUint32(value) {
	const buffer = Buffer.alloc(4)
	buffer.writeUInt32BE(value)
	return buffer
}

function encodeUint32Array(values) {
	const buffer = Buffer.alloc(20)
	for (let i = 0; i < values.length; i++) {
		buffer.writeUInt32BE(values[i], i * 4)
	}
	return buffer
}
