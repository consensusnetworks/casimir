export default function useFormat() {
    function formatDecimalString(decimalString: string) {
        return parseFloat(decimalString).toFixed(2)
    }

    return { formatDecimalString }
}