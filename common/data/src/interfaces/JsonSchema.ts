export interface JsonSchema {
    $id: string,
    $schema: string,
    title: string,
    type: string,
    properties: {
        [key: string]: {
            type: string,
            description: string
        }
    },
}