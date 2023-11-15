import { ref } from "vue"
const txData = ref(null as any)

export default function useTxData () {

	function generateRandomBalance(index: number, walletAddress: string) {
		if (
			walletAddress === "0xd557a5745d4560B24D36A68b52351ffF9c86A212"
		) {
			const lowBound = 100 + index * 1.06
			const highBound = 200 + index * 1.06
			return Math.random() * (highBound - lowBound) + lowBound
		} else if (walletAddress === "0x728474D29c2F81eb17a669a7582A2C17f1042b57") {
			const lowBound = 180 + index * 1.15
			const highBound = 300 + index * 1.15
			return Math.random() * (highBound - lowBound) + lowBound
		}
	}
  
	function generateRandomDate() {
		// Generate a random date within the last two years
		const startDate = new Date()
		startDate.setFullYear(startDate.getFullYear() - 2)
		const endDate = new Date()
		const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()))
  
		const year = randomDate.getFullYear()
		const month = String(randomDate.getMonth() + 1).padStart(2, "0")
		const day = String(randomDate.getDate()).padStart(2, "0")
		const hours = String(randomDate.getHours()).padStart(2, "0")
		const minutes = String(randomDate.getMinutes()).padStart(2, "0")
		const seconds = String(randomDate.getSeconds()).padStart(2, "0")
		const milliseconds = String(randomDate.getMilliseconds()).padStart(3, "0")
  
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}:${milliseconds}`
	}

	function generateMockTransactionData(numTransactions: number) {
		const walletAddresses = [
			"0xd557a5745d4560B24D36A68b52351ffF9c86A212", "0x728474D29c2F81eb17a669a7582A2C17f1042b57",
			// '0x84725c8f954f18709aDcA150a0635D2fBE94fDfF',
			// '0x2EFD9900b748EbFfe658662c1ED853982Bf86ED9',
			// '0x9347155C4586f25306462EbA8BB8df7f06Bb5247',
			// '0x79AE48EF1b199C586A05D1e3bC0f83fBe576d1ae',
			// '0xBE5F02D2d08994288aCF53ddC47d8150d41fb3A8',
			// '0xd3260De619cc58a6A61Dfa1DDDb52d760384f9a8',
			// '0xFcB0d31595fB9bB641DeEE0E4E50050D613337C0',
			// '0xc3178D118c54954b4811958916ca7B3b5D2cEDc5'
		]
  
		const data = []
  
		for (let i = 0; i < numTransactions; i++) {
			const transaction = {
				walletAddress: walletAddresses[i % walletAddresses.length],
				walletBalance: i,
				txDirection: Math.random() < 0.5? "incoming": "outgoing",
				txId: "0xf46d39ca96e489fb0eb2097f073bfde2dc7960bf8358e0692fa79cc8597d283e",
				receivedAt: generateRandomDate(),
				amount: (Math.random() * 20.00).toFixed(2),
				price: (Math.random() * 2000.00).toFixed(2),
				gasFee: (Math.random() * 10.00).toFixed(2),
				stakeFee: (Math.random() * 10.00).toFixed(2),
				rewards:(Math.random() * 10.00).toFixed(2),
				status: Math.random() > 0.5? "Pending" : "Active",
				type: Math.random() > 0.5? null : Math.random() > 0.5? "Stake SSV" : "Withdraw",
			}
			data.push(transaction)
		}

		data.sort((a, b) => {
			return new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime()
		})

		for (let i = 0; i < data.length; i++) {
			data[i].walletBalance = generateRandomBalance(i, data[i].walletAddress) as number
		}
  
		return data
	}

	const mockData = () => {
		const numTransactions = 720 // Number of transactions to generate
		const data = generateMockTransactionData(numTransactions)
		// const jsonData = JSON.stringify(data, null, 2)

		txData.value = data
	}
	return {
		txData,
		mockData
	}
}