import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const proxyScript = join(__dirname, "proxy.js");

// We only start the proxy if it exists (which it should)
if (existsSync(proxyScript)) {
  if (process.platform === "win32") {
    // Start detached and completely hidden on Windows
    execSync(`start /b /min node "${proxyScript}" >nul 2>&1`);
  } else {
    // Start detached on Unix
    execSync(`node "${proxyScript}" >/dev/null 2>&1 &`);
  }
}
