export interface JsonSchema {
    $id: string,
    $schema: string,
    title: string,
    type: string,
    properties: {
        [key: string]: {
            type: string,
            description: string,
            default?: string | number | boolean | null
        }
    },
    uniqueFields?: string[],
    composite_key?: string
}