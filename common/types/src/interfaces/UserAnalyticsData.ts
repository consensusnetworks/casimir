import { AnalyticsData } from "@casimir/types"

export interface UserAnalyticsData {
    oneMonth: {
        labels: string[];
        data: AnalyticsData[];
      }
      sixMonth: {
        labels: string[]
        data: AnalyticsData[]
      }
      oneYear: {
        labels: string[]
        data: AnalyticsData[]
      }
      historical: {
        labels: string[]
        data: AnalyticsData[]
      }
}