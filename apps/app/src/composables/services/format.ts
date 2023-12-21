export default function useFormat() {
    function convertString(inputString: string) {
        if (inputString.length && inputString.length <= 3) {
            return inputString
        }
      
        const start = inputString.substring(0, 3)
        const end = inputString.substring(inputString.length - 3)
        const middle = ".".repeat(3)
      
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
        return siSymbol.length > 0 ? formattedFloat + siSymbol : formattedFloat
    }

    function formatEthersCasimirStaking(inputFloat: number) {
        // Ensure the number has 18 decimal places
        const formattedNumber = inputFloat.toFixed(18)

        // Split the number into integer and decimal parts
        const parts = formattedNumber.split(".")

        // Add commas to the integer part
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    
        // Rejoin the integer and decimal parts
        return parts.join(".")
    }

    function parseEthersCasimir(inputString: string): number {
        const siSymbols: { [key: string]: number } = {
            "K": 1e3,
            "M": 1e6,
            "B": 1e9
        }
    
        // Extract the numeric part and the SI symbol
        const matches = inputString.match(/([0-9.,]+)([KMB])?/)
        if (!matches) {
            throw new Error("Invalid input format")
        }
    
        const [ , numericPart, siSymbol] = matches
    
        // Replace commas and convert to a float
        let value = parseFloat(numericPart.replace(/,/g, ""))
    
        // Apply the multiplication factor if an SI symbol is present
        if (siSymbol && siSymbols[siSymbol]) {
            value *= siSymbols[siSymbol]
        }
    
        return value
    }

    function trimAndLowercaseAddress(address: string) {
        return address.trim().toLowerCase()
    }

    return { 
        convertString, 
        formatDecimalString,
        formatEthersCasimir,
        formatEthersCasimirStaking,
        parseEthersCasimir,
        trimAndLowercaseAddress,
    }
}