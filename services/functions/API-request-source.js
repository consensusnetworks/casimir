const [ 
	genesisTimestamp,
	viewsAddress,
	getCompoundablePoolIdsSignature,
	getDepositedPoolCountSignature,
	getDepositedPoolPublicKeysSignature,
	getDepositedPoolStatusesSignature,
	getSweptBalanceSignature,
	previousReportTimestamp,
	reportTimestamp,
	reportBlockNumber,
	requestType
] = args
const ethereumUrl = secrets.ethereumRpcUrl ?? 'http://127.0.0.1:8545'
const ethereumBeaconUrl = secrets.ethereumBeaconRpcUrl ?? 'http://127.0.0.1:5052'
const previousReportSlot = Math.floor((previousReportTimestamp - genesisTimestamp) / 12)
const previousReportEpoch = Math.floor(previousReportSlot / 32)
const reportSlot = Math.floor((reportTimestamp - genesisTimestamp) / 12)
const reportEpoch = Math.floor(reportSlot / 32)

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
	const startIndex = BigInt(0).toString(16).padStart(64, '0')
	const endIndex = BigInt(depositedPoolCount).toString(16).padStart(64, '0')
	
	const depositedPoolPublicKeys = await getDepositedPoolPublicKeys(startIndex, endIndex)
	const validators = await getValidators(depositedPoolPublicKeys)

	const beaconBalance = Functions.gweiToWei(validators.reduce((accumulator, { balance }) => {
		accumulator += parseFloat(balance)
		return accumulator
	}, 0))

	const sweptBalance = Functions.gweiToWei(await getSweptBalance(startIndex, endIndex))

	console.log("Results", {
		beaconBalance,
		sweptBalance
	})

	return Buffer.concat([
		Functions.encodeUint128(beaconBalance),
		Functions.encodeUint128(sweptBalance)
	])
}

async function detailsHandler() {
	const depositedPoolCount = await getDepositedPoolCount()
	const startIndex = BigInt(0).toString(16).padStart(64, '0')
	const endIndex = BigInt(depositedPoolCount).toString(16).padStart(64, '0')
	
	const depositedPoolPublicKeys = await getDepositedPoolPublicKeys(startIndex, endIndex)
	const depositedPoolStatuses = await getDepositedPoolStatuses(startIndex, endIndex)
	for (let i = 0; i < depositedPoolCount; i++) {
		console.log("* Pool")
		console.log("-- Public key", depositedPoolPublicKeys[i])
		console.log("-- Status", depositedPoolStatuses[i])
	}
	const validators = await getValidators(depositedPoolPublicKeys)

	const activatedDeposits = validators.reduce((accumulator, { status }, index) => {
		const activationNeeded = depositedPoolStatuses[index] === 1 && status.includes('active')
		if (activationNeeded) {
			accumulator += 1
		}
		return accumulator
	}, 0)

	const forcedExits = validators.reduce((accumulator, { status, validator }) => {
		const { slashed } = validator
		const ongoing = status !== 'withdrawal_done'
		if (slashed && ongoing) {
			accumulator += 1
		}
		return accumulator
	}, 0)

	const completedExits = validators.reduce((accumulator, { status, validator }) => {
		const { withdrawable_epoch } = validator
		const completedDuringReportPeriod = withdrawable_epoch >= previousReportEpoch && withdrawable_epoch < reportEpoch
		const completed = status === 'withdrawal_done'
		if (completedDuringReportPeriod && completed) {
			accumulator += 1
		}
		return accumulator
	}, 0)

	const compoundablePoolIds = await getCompoundablePoolIds(startIndex, endIndex)

	console.log("Results", {
		activatedDeposits,
		forcedExits,
		completedExits,
		compoundablePoolIds
	})

	return Buffer.concat([
		encodeUint32(activatedDeposits),
		encodeUint32(forcedExits),
		encodeUint32(completedExits),
		encodeUint32Array(compoundablePoolIds)
	])
}

async function getCompoundablePoolIds(startIndex, endIndex) {
	const request = await Functions.makeHttpRequest({
		url: ethereumUrl,
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
				{ blockNumber: '0x' + parseInt(reportBlockNumber).toString(16) }
			]
		}
	})
	if (request.error) throw new Error('Failed to get compoundable pool IDs')
	const rawPoolIds = request.data.result.slice(2)
	let poolIds = []
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
		url: ethereumUrl,
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
				{ blockNumber: '0x' + parseInt(reportBlockNumber).toString(16) }
			]
		}
	})
	if (request.error) throw new Error('Failed to get deposited pool count')
	return Number(request.data.result)
}

async function getDepositedPoolPublicKeys(startIndex, endIndex) {
	const request = await Functions.makeHttpRequest({
		url: ethereumUrl,
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					data: getDepositedPoolPublicKeysSignature + startIndex + endIndex
				},
				{ blockNumber: '0x' + parseInt(reportBlockNumber).toString(16) }
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
	return [
		'0x853b4caf348bccddbf7e1c25e68676c3b3f857958c93b290a2bf84974ea33c4f793f1bbf7e9e9923f16e2237038e7b69',
		'0x8889a628f263c414e256a1295c3f49ac1780e0b9cac8493dd1bd2f17b3b257660a12fb88f65333fa00c9a735c0f8d0e8'
	]
}

async function getDepositedPoolStatuses(startIndex, endIndex) {
	const request = await Functions.makeHttpRequest({
		url: ethereumUrl,
		method: 'POST',
		data: {
			id: 1,
			jsonrpc: '2.0',
			method: 'eth_call',
			params: [
				{
					to: viewsAddress,
					data: getDepositedPoolStatusesSignature + '0'.repeat(24) + startIndex + endIndex
				},
				{ blockNumber: '0x' + parseInt(reportBlockNumber).toString(16) }
			]
		}
	})
	if (request.error) throw new Error('Failed to get validator statuses')
	console.log("Raw statuses", request.data.result)
	const rawStatuses = request.data.result.slice(2)
	const statuses = []
	for (let i = 0; i < 5; i++) {
		let start = i * 8
		let end = start + 8
		let status = parseInt(rawStatuses.slice(start, end), 16)
		statuses.push(status)
	}
	return [1, 2]
}

async function getSweptBalance(startIndex, endIndex) {
	const request = await Functions.makeHttpRequest({
		url: ethereumUrl,
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
				{ blockNumber: '0x' + parseInt(reportBlockNumber).toString(16) }
			]
		}
	})
	if (request.error) throw new Error('Failed to get swept balance')
	return parseFloat(request.data.result.slice(0, -9))
}

async function getValidators(validatorPublicKeys) {
	const request = await Functions.makeHttpRequest({
		url: `${ethereumBeaconUrl}/eth/v1/beacon/states/finalized/validators?id=${validatorPublicKeys.join(',')}`
	})
	if (request.error) throw new Error('Failed to get validators')
	return request.data.data
}

function encodeUint32(value) {
    const buffer = Buffer.alloc(32)
    buffer.writeUInt32BE(value, 28)
    return buffer
}

function encodeUint32Array(values) {
    const buffer = Buffer.alloc(32 * values.length)
    for (let i = 0; i < values.length; i++) {
        buffer.writeUInt32BE(values[i], i * 32 + 28)
    }
    return buffer
}