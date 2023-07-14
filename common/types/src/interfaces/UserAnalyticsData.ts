export interface UserAnalyticsData {
    oneMonth: {
        labels: string[];
        data: number[];
      }
      sixMonth: {
        labels: string[]
        data: number[]
      }
      oneYear: {
        labels: string[]
        data: number[]
      }
      historical: {
        labels: string[]
        data: number[]
      }
}