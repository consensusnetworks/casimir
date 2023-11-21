/**
 * Convert any string to camelCase.
 * @param string - The input string
 * @returns A camelCase string from the input string
 */
export function camelCase(string: string): string {
    const words = string.split(/[\s_-]+/).map(word => {
        return word.replace(/\w+/g, (word) => {
            return word[0].toUpperCase() + word.slice(1).toLowerCase()
        })
    })
    const result = words.join("")
    return result[0].toLowerCase() + result.slice(1)
}

/**
 * Convert any string to PascalCase
 *
 * @param string - The input string
 * @returns A PascalCase string from the input string
 *
 */
export function pascalCase(string: string): string {
    const words = string.split(/[\s_-]+/).map(word => {
        return word.replace(/\w+/g, (word) => {
            return word[0].toUpperCase() + word.slice(1).toLowerCase()
        })
    })
    const result = words.join("")
    return result
}

/**
 * Convert any string to snake_case.
 * @param string - The input string
 * @returns A snake_case string from the input string
 */
export function snakeCase(string: string): string {
    return string.replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join("_")
}

/**
 * Convert any string to kebab-case.
 * @param string - The input string
 * @returns A kebab-case string from the input string
 */
export function kebabCase(string: string): string {
    return string.replace(/\W+/g, " ")
        .split(/ |\B(?=[A-Z])/)
        .map(word => word.toLowerCase())
        .join("-")
}