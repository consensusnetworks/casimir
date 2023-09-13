export default function useFormat() {
    function convertString(inputString: string){
        if (inputString.length && inputString.length <= 4) {
          return inputString
        }
      
        const start = inputString.substring(0, 4)
        const end = inputString.substring(inputString.length - 4)
        const middle = '.'.repeat(4)
      
        return start + middle + end
    }

    function formatDecimalString(decimalString: string) {
        return parseFloat(decimalString).toFixed(2)
    }

    function formatNumber(number: number) {
        const SI_SYMBOL = ['', 'K', 'M', 'B', 'T', 'P', 'E']
        const tier = Math.log10(Math.abs(number)) / 3 | 0
        if(tier === 0) return number.toFixed(2)
        const suffix = SI_SYMBOL[tier]
        const scale = Math.pow(10, tier * 3)
        const scaled = number / scale
        return scaled.toFixed(2) + suffix
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