import { ref } from 'vue'
import * as XLSX from 'xlsx'

export default function useUtilities() {
    const convertString = (inputString: string) => {
        if (inputString.length && inputString.length <= 4) {
          return inputString
        }
      
        const start = inputString.substring(0, 4)
        const end = inputString.substring(inputString.length - 4)
        const middle = '.'.repeat(4)
      
        return start + middle + end
    }
      
    function exportFile(checkedItems: any, filteredData: any) {
        const jsonData = checkedItems.value.length > 0 ? checkedItems.value : filteredData.value
      
        const isMac = navigator.userAgent.indexOf('Mac') !== -1
        const fileExtension = isMac ? 'csv' : 'xlsx'
      
        if (fileExtension === 'csv') {
          const csvContent = convertJsonToCsv(jsonData)
          downloadFile(csvContent, 'operator_performance.csv', 'text/csv')
        } else {
          const excelBuffer = convertJsonToExcelBuffer(jsonData)
          downloadFile(excelBuffer, 'operator_performance.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        }
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

      return {
        convertString,
        exportFile,
        formatNumber
      }
}

function downloadFile (content: any, filename: string, mimeType: any) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()

    // Cleanup
    URL.revokeObjectURL(url)
}

function convertJsonToExcelBuffer (jsonData: unknown[]) {
    const worksheet = XLSX.utils.json_to_sheet(jsonData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })

    return excelBuffer
}

function convertJsonToCsv (jsonData: any[]) {
    const separator = ','
    const csvRows = []
  
    if (!Array.isArray(jsonData)) {
      return ''
    }
  
    if (jsonData.length === 0) {
      return ''
    }
  
    const keys = Object.keys(jsonData[0])
  
    // Add headers
    csvRows.push(keys.join(separator))
  
    // Convert JSON data to CSV rows
    jsonData.forEach(obj => {
      const values = keys.map(key => obj[key])
      csvRows.push(values.join(separator))
    })
  
    return csvRows.join('\n')
  }