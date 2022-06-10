import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { WebsiteStack } from '../lib/website/website-stack'

// Todo actually test something
test('Website Created', () => {
  const app = new cdk.App()
  const stack = new WebsiteStack(app, 'MyTestStack')
  const template = Template.fromStack(stack)
  console.log(template)
  // Object.keys(template.findOutputs('*')).forEach(output => {
  //   expect(output).toBeDefined()
  // })
})
