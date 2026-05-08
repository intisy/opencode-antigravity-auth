const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoDir = path.join(process.env.USERPROFILE, ".config", "opencode", "repos", "opencode-antigravity-auth");
const pluginsDir = path.join(process.env.USERPROFILE, ".config", "opencode", "plugins");
const pluginPath = path.join(repoDir, "src", "plugin.ts");

let src = fs.readFileSync(pluginPath, "utf-8");
let changes = 0;

// =============================================================================
// FIX 1: Cross-family fallback bypasses soft quota threshold
// When Claude is rate-limited and we fall back to Gemini, bypass soft quota
// because the user has no other option.
// =============================================================================

// Fix 1a: The cross-family fallback gemini account lookup
// Change: config.soft_quota_threshold_percent -> 100 in the cross-family fallback
const crossFamilyLookupOld = `const geminiAccount = accountManager.getCurrentOrNextForFamily(
                  newFamily, newModel, config.account_selection_strategy,
                  preferredHeaderStyle, config.pid_offset_enabled,
                  config.soft_quota_threshold_percent, softQuotaCacheTtlMs
                );`;

const crossFamilyLookupNew = `// Bypass soft quota for cross-family fallback - user has no other option
                let geminiAccount = accountManager.getCurrentOrNextForFamily(
                  newFamily, newModel, config.account_selection_strategy,
                  preferredHeaderStyle, config.pid_offset_enabled,
                  100, // bypass soft quota threshold
                  softQuotaCacheTtlMs
                );
                // If preferred style fails, try all header styles
                if (!geminiAccount) {
                  const altStyle = preferredHeaderStyle === "antigravity" ? "gemini-cli" : "antigravity";
                  geminiAccount = accountManager.getCurrentOrNextForFamily(
                    newFamily, newModel, config.account_selection_strategy,
                    altStyle, config.pid_offset_enabled,
                    100,
                    softQuotaCacheTtlMs
                  );
                }`;

if (src.includes(crossFamilyLookupOld)) {
  src = src.replace(crossFamilyLookupOld, crossFamilyLookupNew);
  changes++;
  console.log("FIX 1a: Patched cross-family fallback to bypass soft quota");
} else {
  console.log("FIX 1a: Pattern not found (may already be patched)");
}

// Fix 1b: After crossFamilyFallbackApplied is set, the main loop's account
// selection should also bypass soft quota threshold.
// Find the main getCurrentOrNextForFamily call and make it use 100 when fallback is active.
const mainAccountLookupOld = `let account = accountManager.getCurrentOrNextForFamily(
              family, 
              model, 
              config.account_selection_strategy,
              preferredHeaderStyle,
              config.pid_offset_enabled,
              config.soft_quota_threshold_percent,
              softQuotaCacheTtlMs,
            );`;

const mainAccountLookupNew = `// When cross-family fallback is active, bypass soft quota (user has no other option)
            const effectiveSoftQuotaThreshold = crossFamilyFallbackApplied ? 100 : config.soft_quota_threshold_percent;
            let account = accountManager.getCurrentOrNextForFamily(
              family, 
              model, 
              config.account_selection_strategy,
              preferredHeaderStyle,
              config.pid_offset_enabled,
              effectiveSoftQuotaThreshold,
              softQuotaCacheTtlMs,
            );`;

if (src.includes(mainAccountLookupOld)) {
  src = src.replace(mainAccountLookupOld, mainAccountLookupNew);
  changes++;
  console.log("FIX 1b: Patched main account lookup to bypass soft quota during fallback");
} else {
  console.log("FIX 1b: Pattern not found (may already be patched)");
}

// Fix 1c: The allowQuotaFallback alternate lookup should also use effective threshold
const altLookupOld = `if (!account && allowQuotaFallback) {
              const alternateHeaderStyle: HeaderStyle =
                preferredHeaderStyle === "antigravity" ? "gemini-cli" : "antigravity";
              account = accountManager.getCurrentOrNextForFamily(
                family,
                model,
                config.account_selection_strategy,
                alternateHeaderStyle,
                config.pid_offset_enabled,
                config.soft_quota_threshold_percent,
                softQuotaCacheTtlMs,
              );`;

const altLookupNew = `if (!account && allowQuotaFallback) {
              const alternateHeaderStyle: HeaderStyle =
                preferredHeaderStyle === "antigravity" ? "gemini-cli" : "antigravity";
              account = accountManager.getCurrentOrNextForFamily(
                family,
                model,
                config.account_selection_strategy,
                alternateHeaderStyle,
                config.pid_offset_enabled,
                effectiveSoftQuotaThreshold,
                softQuotaCacheTtlMs,
              );`;

if (src.includes(altLookupOld)) {
  src = src.replace(altLookupOld, altLookupNew);
  changes++;
  console.log("FIX 1c: Patched alternate header style lookup to use effective threshold");
} else {
  console.log("FIX 1c: Pattern not found (may already be patched)");
}

// =============================================================================
// Write fixed source
// =============================================================================
if (changes > 0) {
  fs.writeFileSync(pluginPath, src, "utf-8");
  console.log(`\nApplied ${changes} fix(es) to plugin.ts`);
} else {
  console.log("\nNo changes applied - patterns may already be patched or different");
}

// =============================================================================
// REBUILD
// =============================================================================
console.log("\n=== Building ===");
try {
  execSync("bun run build", { cwd: repoDir, stdio: "inherit" });
  console.log("tsc OK");
} catch (e) {
  console.error("tsc FAILED:", e.message);
  process.exit(1);
}

console.log("\n=== Bundling ===");
try {
  execSync(
    'bun build dist/index.js --bundle --external @opencode-ai/plugin --external @opencode-ai/sdk --outfile dist/bundled.js --target node',
    { cwd: repoDir, stdio: "inherit" }
  );
  console.log("bundle OK");
} catch (e) {
  console.error("bundle FAILED:", e.message);
  process.exit(1);
}

console.log("\n=== Deploying ===");
const src2 = path.join(repoDir, "dist", "bundled.js");
const dst = path.join(pluginsDir, "antigravity-auth.js");
fs.copyFileSync(src2, dst);
console.log("Copied to", dst);

// =============================================================================
// VERIFY
// =============================================================================
console.log("\n=== Verifying ===");
const bundle = fs.readFileSync(dst, "utf-8");

const checks = [
  ["Default export", "as default"],
  ["Manage proxies menu item", "Manage proxies"],
  ["Cross-family fallback 400 handler", "Cross-family fallback failed"],
  ["Progress toast", "Waiting for"],
  ["Soft quota bypass in fallback", "bypass soft quota"],
];

let allOk = true;
for (const [name, pattern] of checks) {
  if (bundle.includes(pattern)) {
    console.log(`  ✅ ${name}`);
  } else {
    console.log(`  ❌ ${name} - MISSING`);
    allOk = false;
  }
}

if (allOk) {
  console.log("\n✅ All checks passed. Bundle is ready.");
} else {
  console.log("\n⚠️ Some checks failed!");
}

// Show bundle size
const stats = fs.statSync(dst);
console.log(`Bundle size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
