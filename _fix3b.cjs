const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoDir = "C:\\Users\\finn\\.config\\opencode\\repos\\opencode-antigravity-auth";
const pluginsDir = "C:\\Users\\finn\\.config\\opencode\\plugins";
const pluginPath = path.join(repoDir, "src", "plugin.ts");

let src = fs.readFileSync(pluginPath, "utf-8");
let changes = 0;

// Fix 1: Line ~1614 - account = allEnabled[0] → allEnabled[0] ?? null
// And wrap the pushDebug in a null check
const old1 = `account = allEnabled[0];\r\n                pushDebug(\`cross-family-bypass: forced pick idx=\${account.index} (global filters overridden)\`);`;
const new1 = `account = allEnabled[0] ?? null;\r\n                if (account) pushDebug(\`cross-family-bypass: forced pick idx=\${account.index} (global filters overridden)\`);`;

if (src.includes(old1)) {
  src = src.replace(old1, new1);
  changes++;
  console.log("Fix 1: account type fix ✓");
} else {
  console.log("Fix 1: marker not found, trying LF variant...");
  const old1lf = old1.replace(/\r\n/g, "\n");
  const new1lf = new1.replace(/\r\n/g, "\n");
  if (src.includes(old1lf)) {
    src = src.replace(old1lf, new1lf);
    changes++;
    console.log("Fix 1: account type fix (LF) ✓");
  } else {
    console.log("Fix 1: NOT FOUND");
  }
}

// Fix 2: Line ~1648 - geminiAccount = allEnabled[0] → allEnabled[0] ?? null
// And wrap the pushDebug in a null check
const old2 = `geminiAccount = allEnabled[0];\r\n                    pushDebug(\`cross-family-fallback: last-resort idx=\${geminiAccount.index}\`);`;
const new2 = `geminiAccount = allEnabled[0] ?? null;\r\n                    if (geminiAccount) pushDebug(\`cross-family-fallback: last-resort idx=\${geminiAccount.index}\`);`;

if (src.includes(old2)) {
  src = src.replace(old2, new2);
  changes++;
  console.log("Fix 2: geminiAccount type fix ✓");
} else {
  console.log("Fix 2: marker not found, trying LF variant...");
  const old2lf = old2.replace(/\r\n/g, "\n");
  const new2lf = new2.replace(/\r\n/g, "\n");
  if (src.includes(old2lf)) {
    src = src.replace(old2lf, new2lf);
    changes++;
    console.log("Fix 2: geminiAccount type fix (LF) ✓");
  } else {
    console.log("Fix 2: NOT FOUND");
  }
}

console.log(`\nApplied ${changes} type fixes`);
if (changes > 0) {
  fs.writeFileSync(pluginPath, src, "utf-8");
}

// BUILD
console.log("\n=== tsc ===");
try {
  execSync("bun run build", { cwd: repoDir, stdio: "inherit" });
  console.log("tsc OK");
} catch (e) {
  console.error("tsc FAILED:", e.message.slice(0, 500));
  process.exit(1);
}

console.log("\n=== bundle ===");
try {
  execSync(
    'bun build dist/index.js --bundle --external @opencode-ai/plugin --external @opencode-ai/sdk --outfile dist/bundled.js --target node',
    { cwd: repoDir, stdio: "inherit" }
  );
  console.log("bundle OK");
} catch (e) {
  console.error("bundle FAILED:", e.message.slice(0, 300));
  process.exit(1);
}

// DEPLOY
console.log("\n=== deploy ===");
const bundleSrc = path.join(repoDir, "dist", "bundled.js");
const bundleDst = path.join(pluginsDir, "antigravity-auth.js");
fs.copyFileSync(bundleSrc, bundleDst);
console.log("Copied to", bundleDst);

// VERIFY
console.log("\n=== verify ===");
const bundle = fs.readFileSync(bundleDst, "utf-8");
const checks = [
  ["Default export", "as default"],
  ["Manage proxies in main menu", 'label: "Manage proxies", value: { type: "proxies" }'],
  ["Cross-family 400 handler", "Cross-family fallback failed"],
  ["Progress toast", "Waiting for"],
  ["Cross-family bypass", "cross-family-bypass"],
  ["Last-resort pick", "last-resort"],
  ["Synthetic error for exhaustion", "temporarily unavailable"],
  ["proxyIdx default", "proxiesAccountIndex ??"],
  ["Manage proxies in account submenu", 'label: "Manage proxies", value: "proxies"'],
];
for (const [name, pat] of checks) {
  console.log(`  ${bundle.includes(pat) ? "✅" : "❌"} ${name}`);
}
console.log(`\nBundle: ${(fs.statSync(bundleDst).size / 1024 / 1024).toFixed(2)} MB`);

// COMMIT & PUSH
console.log("\n=== commit ===");
try {
  execSync("git add -A", { cwd: repoDir, stdio: "inherit" });
  execSync('git commit -m "Fix: cross-family bypass filters + manage proxies in main menu + type fixes"', { cwd: repoDir, stdio: "inherit" });
  console.log("commit OK");
} catch (e) {
  console.log("commit skipped:", e.message?.slice(0, 100));
}

console.log("\n=== push ===");
try {
  execSync("git push origin main", { cwd: repoDir, stdio: "inherit", timeout: 30000 });
  console.log("push OK");
} catch (e) {
  console.log("push failed:", e.message?.slice(0, 200));
}
