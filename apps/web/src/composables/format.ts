export default function useFormat() {
	function convertString(inputString: string) {
		if (inputString.length && inputString.length <= 4) {
			return inputString
		}
      
		const start = inputString.substring(0, 4)
		const end = inputString.substring(inputString.length - 4)
		const middle = ".".repeat(4)
      
		return start + middle + end
	}

	function formatDecimalString(decimalString: string) {
		return parseFloat(decimalString).toFixed(2)
	}

	function formatNumber(number: number) {
		const SI_SYMBOL = ["",
			"K",
			"M",
			"B",
			"T",
			"P",
			"E"]
		const tier = Math.floor(Math.log10(Math.abs(number)) / 3)
		let scale, scaled, suffix
        
		if (number === 0) {
			return "0.00"
		} else if (Math.abs(number) < 1) {
			// Find the position of the first non-zero digit after the decimal point
			const decimalPlaces = Math.ceil(-Math.log10(Math.abs(number)))
			// Limit to 6 decimal places
			const fixedDecimals = Math.min(decimalPlaces, 6)
			return number.toFixed(fixedDecimals)
		} else if (tier === 0) {
			return number.toFixed(2)
		} else {
			suffix = SI_SYMBOL[tier]
			scale = Math.pow(10, tier * 3)
			scaled = number / scale
			return scaled.toFixed(2) + suffix
		}
	}
    

	function trimAndLowercaseAddress(address: string) {
		return address.trim().toLowerCase()
	}

	return { 
		convertString, 
		formatDecimalString,
		formatNumber,
		trimAndLowercaseAddress,
	}
}