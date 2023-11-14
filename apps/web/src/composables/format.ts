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

    function formatEthersCasimir(inputFloat: number, customDecimals?: number): string {
        const siSymbols: { [key: string]: number } = {
            "K": 1e3,
            "M": 1e6,
            "B": 1e9
        }
    
        const [siSymbol, magnitude] = Object.entries(siSymbols)
            .reduce(([selectedSymbol, selectedMagnitude], [symbol, mag]) =>
                Math.abs(inputFloat) >= mag ? [symbol, mag] : [selectedSymbol, selectedMagnitude], ["", 1])
    
        let numDecimals: number
        if (customDecimals !== undefined) {
            numDecimals = customDecimals
        } else if (Math.abs(inputFloat) < 1) {
            numDecimals = 9
        } else if (Math.abs(inputFloat) < 5) {
            numDecimals = 6
        } else {
            numDecimals = 2
        }
    
        let formattedFloat = (inputFloat / magnitude).toFixed(numDecimals)
        
        if (numDecimals > 0) {
            formattedFloat = formattedFloat.replace(/\.?0+$/, "")
        }
        
        return formattedFloat + siSymbol
    }

    function trimAndLowercaseAddress(address: string) {
        return address.trim().toLowerCase()
    }

    return { 
        convertString, 
        formatDecimalString,
        formatEthersCasimir,
        trimAndLowercaseAddress,
    }
}