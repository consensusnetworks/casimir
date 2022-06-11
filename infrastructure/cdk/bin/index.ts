#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { WebsiteStack } from '../lib/website/website-stack'
import { UsersStack } from '../lib/users/users-stack'

const project = process.env.PROJECT?.replace(/\b\w/g, c => c.toUpperCase())
const stage = process.env.STAGE?.replace(/\b\w/g, c => c.toUpperCase())

const defaultEnv  = { account: '257202027633', region: 'us-east-2' }

const app = new cdk.App()
new WebsiteStack(app, `${project}WebsiteStack${stage}`, { env: defaultEnv })
new UsersStack(app, `${project}UsersStack${stage}`, { env: defaultEnv })
