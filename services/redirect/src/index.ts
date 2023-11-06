// eslint-disable-next-line @typescript-eslint/no-unused-vars
function handler(event: AWSCloudFrontFunction.Event) {
  if (!event.request.uri.includes(".")) {
    event.request.uri += ".html"
  }
  return event.request
}