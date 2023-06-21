// Functions: Handle requests for validator balances (total active balance and total swept balance) and pool validator details (activated deposits, forced exits, completed exits, and compoundable pool IDs)
// Config: Expose a combination of preset and dynamic Functions config:
//     - Preset args: CasimirViews contract address (obtained after initial deployment), method signatures (`getCompoundablePoolIds(uint256 startIndex, uint256 endIndex)`, `getDepositedPoolCount()`, `getSweptBalance(uint256 startIndex, uint256 endIndex)`, and `getValidatorPublicKeys(uint256 startIndex, uint256 endIndex)`)
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
const getCompoundablePoolIdsSignature = args[4]
const getDepositedPoolCountSignature = args[5]
const getSweptBalanceSignature = args[6]
const getValidatorPublicKeysSignature = args[7]

const url = secrets.ethereumApiUrl

switch (requestType) {
	case '1':
		return await balancesHandler()
	case '2':
		return await detailsHandler()
	default:
		throw new Error('Invalid request type')
}

async function balancesHandler() {
	const depositedPoolCount = await getDepositedPoolCount()
	
	console.log('depositedPoolCount', depositedPoolCount)

	const startIndex = BigInt(0).toString(16).padStart(64, '0')
	const endIndex = BigInt(depositedPoolCount).toString(16).padStart(64, '0')
	
	console.log('startIndex', startIndex)
	console.log('endIndex', endIndex)

	const validatorPublicKeys = await getValidatorPublicKeys(startIndex, endIndex)
	const validators = await getValidators(validatorPublicKeys)

	const activeBalance = validators.reduce((accumulator, { balance }) => {
		accumulator += parseFloat(balance)
		return accumulator
	}, 0)

	const sweptBalance = await getSweptBalance(startIndex, endIndex)

	const response = Buffer.concat([
		encodeUint128(activeBalance),
		encodeUint128(sweptBalance)
	])

	return response
}

async function detailsHandler() {
	const depositedPoolCount = await getDepositedPoolCount()
	
	const startIndex = BigInt(0).toString(16).padStart(64, '0')
	const endIndex = BigInt(depositedPoolCount).toString(16).padStart(64, '0')
	
	const validatorPublicKeys = await getValidatorPublicKeys(startIndex, endIndex)
	const validators = await getValidators(validatorPublicKeys)

	const activatedDeposits = validators.reduce((accumulator, { activation_epoch, status }) => {
		if (status.includes('active') && activation_epoch >= previousReportBlock && activation_epoch < reportBlock) {
			accumulator += 1
		}
		return accumulator
	}, 0)

	const forcedExits = validators.reduce((accumulator, { exit_epoch, status }) => {
		if (status.includes('exiting') && exit_epoch >= previousReportBlock && exit_epoch < reportBlock) {
			accumulator += 1
		}
		return accumulator
	}, 0)

	const completedExits = validators.reduce((accumulator, { exit_epoch, status }) => {
		if (status === 'withdrawal_done' && exit_epoch >= previousReportBlock && exit_epoch < reportBlock) {
			accumulator += 1
		}
		return accumulator
	}, 0)

	const compoundablePoolIds = await getCompoundablePoolIds(startIndex, endIndex)

	const response = Buffer.concat([
		encodeUint32(activatedDeposits),
		encodeUint32(forcedExits),
		encodeUint32(completedExits),
		encodeUint32Array(compoundablePoolIds)
	])

	return response
}

async function getCompoundablePoolIds(startIndex, endIndex) {
	const request = await Functions.makeHttpRequest({
		url: 'http://localhost:8545',
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					data: getCompoundablePoolIdsSignature + '0'.repeat(24) + startIndex + endIndex
				},
				{ blockNumber: reportBlock }
			]
		}
	})
	if (request.error) throw new Error('Failed to get compoundable pool IDs')
	const rawPoolIds = request.data.result.slice(2);
	let poolIds = [];
	for (let i = 0; i < 5; i++) {
		let start = i * 8
		let end = start + 8
		let poolId = parseInt(rawPoolIds.slice(start, end), 16)
		poolIds.push(poolId)
	}
	return poolIds
}

async function getDepositedPoolCount() {
	const request = await Functions.makeHttpRequest({
		url: 'http://localhost:8545',
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					data: getDepositedPoolCountSignature
				},
				{ blockNumber: reportBlock }
			]
		}
	})
	if (request.error) throw new Error('Failed to get deposited pool count')
	return Number(request.data.result)
}

async function getSweptBalance(startIndex, endIndex) {
	const request = await Functions.makeHttpRequest({
		url: 'http://localhost:8545',
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					data: getSweptBalanceSignature + '0'.repeat(24) + startIndex + endIndex
				},
				{ blockNumber: reportBlock }
			]
		}
	})
	if (request.error) throw new Error('Failed to get swept balance')
	return parseFloat(request.data.result.slice(0, -9))
}

async function getValidatorPublicKeys(startIndex, endIndex) {
	const request = await Functions.makeHttpRequest({
		url: 'http://localhost:8545',
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					data: getValidatorPublicKeysSignature + startIndex + endIndex
				},
				{ blockNumber: reportBlock }
			]
		}
	})
	if (request.error) throw new Error('Failed to get validator public keys')
	const rawPublicKeys = request.data.result.slice(2)
	const numKeys = parseInt(rawPublicKeys.slice(64, 128), 16)
	const publicKeys = []
	for (let i = 0; i < numKeys; i++) {
		let offset = 64 * 3 + i * 96
		let length = parseInt(rawPublicKeys.slice(offset, offset + 64), 16) * 2
		let publicKeyStart = offset + 64
		let publicKeyEnd = publicKeyStart + length
		let publicKey = '0x' + rawPublicKeys.slice(publicKeyStart, publicKeyEnd)
		publicKeys.push(publicKey)
	}
	return publicKeys
}

async function getValidators(validatorPublicKeys) {
	const request = await Functions.makeHttpRequest({
		url: `${url}/eth/v1/beacon/states/finalized/validators?id=${validatorPublicKeys.join(',')}`
	})
	if (request.error) throw new Error('Failed to get validators')
	return request.data.data
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
