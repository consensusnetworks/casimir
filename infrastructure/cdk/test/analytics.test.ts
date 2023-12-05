import * as cdk from "aws-cdk-lib"
import * as assertions from "aws-cdk-lib/assertions"
import { Config } from "../src/providers/config"
import { AnalyticsStack } from "../src/providers/analytics"
import { Schema, eventSchema, } from "@casimir/data"

test("Analytics stack created", () => {
    const config = new Config()
    const { env } = config
    const app = new cdk.App()

    const analyticsStack = new AnalyticsStack(app, config.getFullStackName("analytics"), { env })
    const analyticsTemplate = assertions.Template.fromStack(analyticsStack)
    Object.keys(analyticsTemplate.findOutputs("*")).forEach(output => {
        expect(output).toBeDefined()
    })

    const resource = analyticsTemplate.findResources("AWS::Glue::Table")

    const eventTable = Object.keys(resource).filter(key => key.includes("EventTable"))
    const eventColumns = resource[eventTable[0]].Properties.TableInput.StorageDescriptor.Columns
    const eventGlueSchema = new Schema(eventSchema).getGlueColumns()

    for (const column of eventColumns) {
        const { Name: name, Type: type } = column
        const columnName = Object.keys(eventSchema.properties).filter(key => key === name)[0]
        const columnType = eventGlueSchema.filter(key => key.name === name)[0].type.inputString

        expect(columnType).toEqual(type)
        expect(columnName).toEqual(name)
    }

    const workgroup = analyticsTemplate.findResources("AWS::Athena::WorkGroup")

    expect(workgroup).toBeDefined()
})