const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const pluginsDir = "C:\\Users\\finn\\.config\\opencode\\plugins";
const repoDir = "C:\\Users\\finn\\.config\\opencode\\repos\\opencode-antigravity-auth";

// 1. Check file timestamps
console.log("=== File timestamps ===");
const bundlePath = path.join(pluginsDir, "antigravity-auth.js");
const stat = fs.statSync(bundlePath);
console.log(`  Bundle mtime: ${stat.mtime.toISOString()}`);
console.log(`  Bundle size:  ${stat.size} bytes`);
console.log(`  Now:          ${new Date().toISOString()}`);

// 2. Check if there are OTHER plugin files that might shadow this one
console.log("\n=== All plugin files ===");
const files = fs.readdirSync(pluginsDir);
for (const f of files) {
  const s = fs.statSync(path.join(pluginsDir, f));
  if (s.isFile()) {
    console.log(`  ${f.padEnd(40)} ${s.size.toString().padStart(12)} bytes  ${s.mtime.toISOString()}`);
  }
}

// 3. Check repo git state
console.log("\n=== Git state ===");
try {
  console.log(execSync("git log --oneline -5", { cwd: repoDir }).toString().trim());
  console.log("---");
  console.log(execSync("git status --short", { cwd: repoDir }).toString().trim());
} catch(e) {
  console.log("git error:", e.message.slice(0, 200));
}

// 4. Check if dist/bundled.js matches plugins/antigravity-auth.js
console.log("\n=== Bundle comparison ===");
const distBundle = path.join(repoDir, "dist", "bundled.js");
if (fs.existsSync(distBundle)) {
  const distStat = fs.statSync(distBundle);
  console.log(`  dist/bundled.js:       ${distStat.size} bytes  ${distStat.mtime.toISOString()}`);
  console.log(`  plugins/antigravity:   ${stat.size} bytes  ${stat.mtime.toISOString()}`);
  console.log(`  Sizes match: ${distStat.size === stat.size}`);
  
  // Hash comparison
  const crypto = require("crypto");
  const distHash = crypto.createHash("md5").update(fs.readFileSync(distBundle)).digest("hex");
  const pluginHash = crypto.createHash("md5").update(fs.readFileSync(bundlePath)).digest("hex");
  console.log(`  dist hash:   ${distHash}`);
  console.log(`  plugin hash: ${pluginHash}`);
  console.log(`  Match: ${distHash === pluginHash}`);
} else {
  console.log("  dist/bundled.js does NOT exist!");
}

// 5. Check the EXACT showAuthMenu function in the bundle
console.log("\n=== showAuthMenu content in bundle ===");
const bundle = fs.readFileSync(bundlePath, "utf-8");

// Find showAuthMenu definition and dump the items array
const menuIdx = bundle.indexOf("async function showAuthMenu(");
if (menuIdx !== -1) {
  // Find the next ']' after menuIdx which closes the items array
  const section = bundle.substring(menuIdx, menuIdx + 2000);
  const lines = section.split("\n");
  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    console.log(`  ${i}: ${lines[i].trim().substring(0, 120)}`);
  }
} else {
  console.log("  showAuthMenu NOT FOUND in bundle!");
}

// 6. Check showAccountDetails content
console.log("\n=== showAccountDetails content in bundle ===");
const detIdx = bundle.indexOf("async function showAccountDetails(");
if (detIdx !== -1) {
  const section = bundle.substring(detIdx, detIdx + 1500);
  const lines = section.split("\n");
  for (let i = 0; i < Math.min(lines.length, 30); i++) {
    console.log(`  ${i}: ${lines[i].trim().substring(0, 120)}`);
  }
} else {
  console.log("  showAccountDetails NOT FOUND in bundle!");
}

// 7. Check the rate limit throw paths
console.log("\n=== All throws in bundle ===");
const throwRegex = /throw new Error\(`[^`]*rate.limited[^`]*`\)/g;
let match;
let throwCount = 0;
while ((match = throwRegex.exec(bundle)) !== null) {
  throwCount++;
  const lineNum = bundle.substring(0, match.index).split("\n").length;
  console.log(`  L${lineNum}: ${match[0].substring(0, 150)}`);
}
const throwRegex2 = /throw new Error\([^)]*account[^)]*failed/gi;
while ((match = throwRegex2.exec(bundle)) !== null) {
  throwCount++;
  const lineNum = bundle.substring(0, match.index).split("\n").length;
  console.log(`  L${lineNum}: ${match[0].substring(0, 150)}`);
}
console.log(`  Total: ${throwCount} rate-limit throws`);

// 8. Check if any other files import/export the plugin differently
console.log("\n=== Export chain ===");
const exportIdx = bundle.lastIndexOf("as default");
if (exportIdx !== -1) {
  const ctx = bundle.substring(Math.max(0, exportIdx - 200), exportIdx + 50);
  console.log(ctx);
}
