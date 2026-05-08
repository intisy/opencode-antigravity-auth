const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoDir = path.join(process.env.USERPROFILE, ".config", "opencode", "repos", "opencode-antigravity-auth");
const pluginsDir = path.join(process.env.USERPROFILE, ".config", "opencode", "plugins");
const pluginPath = path.join(repoDir, "src", "plugin.ts");

let src = fs.readFileSync(pluginPath, "utf-8");
let changes = 0;

// =============================================================================
// FIX 1: Cross-family fallback gemini account lookup - bypass soft quota (use 100)
// The geminiAccount lookup passes config.soft_quota_threshold_percent which blocks
// gemini accounts that are over 90% quota. During cross-family fallback, user has
// no other option, so we must bypass soft quota.
// =============================================================================

// Fix 1a: Replace the geminiAccount lookup to use 100 instead of config.soft_quota_threshold_percent
// and also try alternate header style
const fix1aRegex = /(\s+\/\/ Try to find a Gemini account immediately\r?\n\s+)const geminiAccount = accountManager\.getCurrentOrNextForFamily\(\r?\n\s+newFamily, newModel, config\.account_selection_strategy,\r?\n\s+preferredHeaderStyle, config\.pid_offset_enabled,\r?\n\s+config\.soft_quota_threshold_percent, softQuotaCacheTtlMs\r?\n\s+\);/;

const fix1aReplacement = `$1// Bypass soft quota for cross-family fallback - user has no other option
                let geminiAccount = accountManager.getCurrentOrNextForFamily(
                  newFamily, newModel, config.account_selection_strategy,
                  preferredHeaderStyle, config.pid_offset_enabled,
                  100, softQuotaCacheTtlMs
                );
                // If preferred header style fails, try alternate
                if (!geminiAccount) {
                  const altStyle = preferredHeaderStyle === "antigravity" ? "gemini-cli" : "antigravity";
                  geminiAccount = accountManager.getCurrentOrNextForFamily(
                    newFamily, newModel, config.account_selection_strategy,
                    altStyle, config.pid_offset_enabled,
                    100, softQuotaCacheTtlMs
                  );
                }`;

if (fix1aRegex.test(src)) {
  src = src.replace(fix1aRegex, fix1aReplacement);
  changes++;
  console.log("FIX 1a: Patched cross-family fallback gemini lookup to bypass soft quota + try alt header style");
} else {
  console.log("FIX 1a: Pattern not found - checking if already patched...");
  if (src.includes("Bypass soft quota for cross-family fallback")) {
    console.log("  -> Already patched");
  } else {
    console.log("  -> NOT FOUND - manual intervention needed");
  }
}

// =============================================================================
// Write
// =============================================================================
if (changes > 0) {
  fs.writeFileSync(pluginPath, src, "utf-8");
  console.log(`\nApplied ${changes} fix(es) to plugin.ts`);
} else {
  console.log("\nNo changes applied");
}

// =============================================================================
// BUILD
// =============================================================================
console.log("\n=== tsc ===");
execSync("bun run build", { cwd: repoDir, stdio: "inherit" });
console.log("tsc OK");

console.log("\n=== bundle ===");
execSync(
  'bun build dist/index.js --bundle --external @opencode-ai/plugin --external @opencode-ai/sdk --outfile dist/bundled.js --target node',
  { cwd: repoDir, stdio: "inherit" }
);
console.log("bundle OK");

console.log("\n=== deploy ===");
const bundleSrc = path.join(repoDir, "dist", "bundled.js");
const bundleDst = path.join(pluginsDir, "antigravity-auth.js");
fs.copyFileSync(bundleSrc, bundleDst);
console.log("Copied to", bundleDst);

// =============================================================================
// VERIFY
// =============================================================================
console.log("\n=== verify ===");
const bundle = fs.readFileSync(bundleDst, "utf-8");
const checks = [
  ["Default export", "as default"],
  ["Manage proxies", "Manage proxies"],
  ["Cross-family 400 handler", "Cross-family fallback failed"],
  ["Progress toast", "Waiting for"],
  ["Soft quota bypass", "Bypass soft quota"],
  ["Alt header style in fallback", "try alternate"],
];
for (const [name, pat] of checks) {
  console.log(`  ${bundle.includes(pat) ? "✅" : "❌"} ${name}`);
}
console.log(`\nBundle: ${(fs.statSync(bundleDst).size / 1024 / 1024).toFixed(2)} MB`);

// =============================================================================
// COMMIT
// =============================================================================
console.log("\n=== commit ===");
try {
  execSync("git add src/plugin.ts", { cwd: repoDir, stdio: "inherit" });
  execSync('git commit -m "Fix cross-family fallback: bypass soft quota + try alt header style"', { cwd: repoDir, stdio: "inherit" });
  console.log("commit OK");
} catch (e) {
  console.log("commit skipped:", e.message?.slice(0, 100));
}

// =============================================================================
// PUSH
// =============================================================================
console.log("\n=== push ===");
try {
  execSync("git push origin main", { cwd: repoDir, stdio: "inherit", timeout: 30000 });
  console.log("push OK");
} catch (e) {
  console.log("push failed:", e.message?.slice(0, 200));
}
