declare const args: string[]

declare const secrets: Record<string, string>

declare const Functions: {
    makeHttpRequest: (options: RequestOptions) => Promise<SuccessResponse | ErrorResponse>
    encodeUint256: (num: bigint | number) => Uint8Array
    encodeInt256: (num: bigint | number) => Uint8Array
    encodeString: (str: string) => Uint8Array
}

interface RequestOptions {
    url: string
    method?: "get" | "head" | "post" | "put" | "delete" | "connect" | "options" | "trace"
    params?: Record<string, string>
    headers?: Record<string, string>
    data?: Record<string, unknown>
    timeout?: number
    responseType?: "json" | "arraybuffer" | "document" | "text" | "stream"
}

interface SuccessResponse {
    error: false
    data?: unknown
    status: number
    statusText: string
    headers?: Record<string, string>
}

interface ErrorResponse {
    error: true
    message?: string
    code?: string
    response?: Response
}
