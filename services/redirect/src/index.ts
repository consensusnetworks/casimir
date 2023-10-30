import path from 'path'
import { CloudFrontRequestHandler } from 'aws-lambda'

export const handler: CloudFrontRequestHandler = (event, context, callback) => {
    const { request } = event.Records[0].cf
    console.log('Request URI', request.uri)

    const parsedPath = path.parse(request.uri)
    console.log('Parsed Path', parsedPath)
    
    let newUri: string
    if (parsedPath.ext === '') {
        newUri = path.join(parsedPath.dir, parsedPath.base, '.html')
    } else {
        newUri = request.uri
    }

    console.log('New URI ', newUri)
    request.uri = newUri

    return callback(null, request)
}