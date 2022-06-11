import { PinpointClient } from '@aws-sdk/client-pinpoint'
const client = new PinpointClient({ region: 'us-east-1' })
export default client
