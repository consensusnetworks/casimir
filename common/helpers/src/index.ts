/**
 * Converts any string to PascalCase.
 *
 * @param str - The input string
 * @returns A PascalCase string from the input string
 *
 */
export function pascalCase(str: string): string {
  return str.replace(/\w+/g, (word) => {
    return word[0].toUpperCase() + word.slice(1).toLowerCase()
  })
}