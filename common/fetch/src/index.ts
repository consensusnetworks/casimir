/**
 * Retry a fetch request
 * @param {RequestInfo} info - URL string or request object
 * @param {RequestInit} [init] - Request init options
 * @param {number | undefined} retriesLeft - Number of retries left (default: 25)
 * @returns {Promise<Response>} Response
 * @example
 * const response = await fetchRetry('https://example.com')
 */
export async function fetchRetry(
    info: RequestInfo, init?: RequestInit, retriesLeft: number | undefined = 25
): Promise<Response> {
    if (retriesLeft === 0) {
        throw new Error("API request failed after maximum retries")
    }

    try {
        const response = await fetch(info, init)        
        if (response.status !== 200) {
            await new Promise(resolve => setTimeout(resolve, 5000))
            console.log("Retrying fetch request to", info, init)
            return await fetchRetry(info, init || {}, retriesLeft - 1)
        }
        return response
    } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 5000))
        console.log("Retrying fetch request to", info, init)
        return await fetchRetry(info, init || {}, retriesLeft - 1)
    }
}