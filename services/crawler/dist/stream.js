"use strict";
async function processIPC(msg) {
  switch (msg.action) {
    case "start":
      await stream(msg);
      break;
    case "stop":
      console.log("stop");
      break;
    default:
      console.log("default");
  }
}
async function stream(msg) {
  const error = msg?.payload?.error;
  if (error) {
    console.log(error);
  }
  const opt = msg.options;
  if (opt.chain === "ethereum") {
    console.log("ethereum");
  }
  setTimeout(() => {
    console.log("done");
  }, 1e4);
  if (process.send) {
    process.send({ action: "stop" });
  }
}
process.on("message", processIPC);
process.on("uncaughtException", (err) => {
  if (process.send) {
    process.send({
      action: "error",
      payload: {
        error: err.message
      }
    });
  }
});
