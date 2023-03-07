"use strict";
var import_index = require("./index");
var import_Ethereum = require("./providers/Ethereum");
var import_aws_helpers = require("@casimir/aws-helpers");
const buff = [];
async function processIpc(msg) {
  switch (msg.action) {
    case "stream":
      await stream("stream", msg);
      break;
    case "subscribe":
      await stream("subscribe", msg);
      break;
    case "pull_blocks":
      if (buff.length === 0)
        throw new Error("Buffer of streamed blocks is empty");
      if (process.send) {
        if (msg.options.verbose) {
          console.log(`sending ${buff.length} blocks to parent process`);
        }
        process.send({
          action: "push_blocks",
          blocks: buff
        });
      }
      break;
    default:
      break;
  }
}
async function stream(event, msg) {
  if (event === "stream") {
    if (msg.options.verbose) {
      console.log("back to streaming");
    }
    if (msg.options.chain === "ethereum") {
      const service = new import_Ethereum.EthereumService({ url: msg.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_URL || "http://localhost:8545" });
      service.provider.on("block", async (b) => {
        const block = await service.getBlock(b);
        const event2 = await service.toEvent(block);
        if (process.env.UPLOAD === "enabled") {
          await (0, import_aws_helpers.uploadToS3)({
            bucket: import_index.eventOutputBucket,
            key: `${block}-events.json`,
            data: JSON.stringify(event2)
          }).finally(() => {
            if (msg.options.verbose) {
              console.log(`uploaded ${block}-events.json`);
            }
          });
        }
        if (msg.options.verbose) {
          console.log(`from stream: ${block.number}`);
        }
      });
    }
    return;
  }
  if (event === "subscribe") {
    if (msg.options.chain === "ethereum") {
      const service = new import_Ethereum.EthereumService({ url: msg.options.serviceOptions?.url || process.env.PUBLIC_ETHEREUM_URL || "http://localhost:8545" });
      service.provider.on("block", async (b) => {
        buff.push(b);
      });
    }
  }
}
process.on("message", processIpc);
