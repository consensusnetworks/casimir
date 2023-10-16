import fs from "fs"

void function() {
  fs.rmSync("build", { recursive: true })
}()