const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoDir = "C:\\Users\\finn\\.config\\opencode\\repos\\opencode-antigravity-auth";
const pluginsDir = "C:\\Users\\finn\\.config\\opencode\\plugins";
const pluginsJson = path.join(pluginsDir, "..", "plugins.json");

function n(s) { return s.replace(/\r\n/g, "\n"); }
function cr(s) { return s.replace(/(?<!\r)\n/g, "\r\n"); }

console.log("=== FIX 4: Diagnostic + aggressive fix ===\n");

// ============================================================================
// STEP 0: Disable autoUpdate to prevent overwriting
// ============================================================================
console.log("--- plugins.json: disable autoUpdate ---");
let pj = fs.readFileSync(pluginsJson, "utf-8");
const pjOld = '"name": "opencode-antigravity-auth",';
// Count how many times autoUpdate appears after our plugin entry
const pluginIdx = pj.indexOf(pjOld);
if (pluginIdx !== -1) {
  // Find the next autoUpdate after this plugin entry
  const afterPlugin = pj.substring(pluginIdx);
  const autoIdx = afterPlugin.indexOf('"autoUpdate": true');
  if (autoIdx !== -1) {
    const absoluteIdx = pluginIdx + autoIdx;
    pj = pj.substring(0, absoluteIdx) + '"autoUpdate": false' + pj.substring(absoluteIdx + '"autoUpdate": true'.length);
    fs.writeFileSync(pluginsJson, pj, "utf-8");
    console.log("  autoUpdate set to false ✓");
  } else {
    console.log("  autoUpdate already false or not found");
  }
} else {
  console.log("  Plugin entry not found in plugins.json!");
}

// ============================================================================
// STEP 1: Fix plugin.ts - Replace ALL throws with synthetic error returns
// ============================================================================
console.log("\n--- plugin.ts ---");
const pluginPath = path.join(repoDir, "src", "plugin.ts");
let src = fs.readFileSync(pluginPath, "utf-8");
let changes = 0;

// 1A: Replace the rate-limit throw (the one causing 5x retry)
// "throw new Error(`All ${accountCount} account(s) rate-limited for ${family}..."
const throwPattern1 = /throw new Error\(\s*`All \$\{accountCount\} account\(s\) rate-limited for \$\{family\}\. ` \+\s*`Quota resets in \$\{waitTimeFormatted\}\. ` \+\s*`Add more accounts with \\`opencode auth login\\` or wait and retry\.`\s*\);/;
const throwReplacement1 = `{
                  const errorMessage = \`[Antigravity] All \${accountCount} account(s) rate-limited for \${family}. Quota resets in \${waitTimeFormatted}. Add more accounts or wait and retry.\`;
                  return createSyntheticErrorResponse(errorMessage, model ?? "unknown");
                }`;

if (throwPattern1.test(src)) {
  src = src.replace(throwPattern1, throwReplacement1);
  changes++;
  console.log("  1A: Replaced rate-limit throw with synthetic response ✓");
} else {
  // Check if already replaced
  if (src.includes("[Antigravity] All ${accountCount} account(s) rate-limited for ${family}")) {
    console.log("  1A: Already applied");
  } else {
    console.log("  1A: PATTERN NOT FOUND - trying manual approach");
    // Direct string search
    const needle = 'throw new Error(\n                    `All ${accountCount} account(s) rate-limited for ${family}.';
    const needleCR = needle.replace(/\n/g, "\r\n");
    if (src.includes(needleCR)) {
      console.log("  1A: Found CRLF variant");
    } else if (src.includes(needle)) {
      console.log("  1A: Found LF variant");
    } else {
      console.log("  1A: Searching for any rate-limited throw...");
      const idx = src.indexOf("rate-limited for ${family}");
      if (idx !== -1) {
        console.log("  Found at offset " + idx + ", context: " + src.substring(Math.max(0,idx-200), idx+100).replace(/\r\n/g, "\\r\\n").substring(0, 300));
      }
    }
  }
}

// 1B: Replace the second throw pattern: "throw lastError || new Error("All Antigravity accounts failed")"
const throwNeedle2 = 'throw lastError || new Error("All Antigravity accounts failed");';
const throwReplace2 = `{
            const msg = lastError?.message ?? "All Antigravity accounts failed";
            return createSyntheticErrorResponse("[Antigravity] " + msg, model ?? "unknown");
          }`;

if (src.includes(throwNeedle2)) {
  src = src.replace(throwNeedle2, throwReplace2);
  changes++;
  console.log("  1B: Replaced 'All Antigravity accounts failed' throw ✓");
} else {
  console.log("  1B: Already applied or not found");
}

// 1C: Replace soft quota throw
const softQuotaThrowPattern = /throw new Error\(\s*`Quota protection: All \$\{accountCount\} account\(s\) are over \$\{threshold\}% usage for \$\{family\}\..*?\);/s;
if (softQuotaThrowPattern.test(src)) {
  src = src.replace(softQuotaThrowPattern, `{
                    const errorMessage = \`[Antigravity] Quota protection: All \${accountCount} account(s) are over \${threshold}% usage for \${family}. Quota resets in \${waitTimeFormatted}.\`;
                    return createSyntheticErrorResponse(errorMessage, model ?? "unknown");
                  }`);
  changes++;
  console.log("  1C: Replaced soft quota throw ✓");
} else {
  console.log("  1C: Already applied or not found");
}

// 1D: Add diagnostic toast to cross-family fallback
const cfDiagNeedle = 'pushDebug(`cross-family-fallback: claude->gemini model=${fallbackModel}`);';
const cfDiagReplace = `pushDebug(\`cross-family-fallback: claude->gemini model=\${fallbackModel}\`);
                await showToast(\`🔄 Claude rate-limited. Attempting Gemini fallback...\`, "info");`;

if (src.includes(cfDiagNeedle) && !src.includes("Attempting Gemini fallback")) {
  src = src.replace(cfDiagNeedle, cfDiagReplace);
  changes++;
  console.log("  1D: Added diagnostic toast to cross-family fallback ✓");
} else {
  console.log("  1D: Already applied or not found");
}

if (changes > 0) {
  fs.writeFileSync(pluginPath, src, "utf-8");
  console.log(`  Written ${changes} fix(es) to plugin.ts`);
}

// ============================================================================
// STEP 2: Check auth-menu.ts has Manage proxies in main menu
// ============================================================================
console.log("\n--- auth-menu.ts verification ---");
const authMenuPath = path.join(repoDir, "src", "plugin", "ui", "auth-menu.ts");
const authSrc = fs.readFileSync(authMenuPath, "utf-8");
if (authSrc.includes("{ label: 'Manage proxies', value: { type: 'proxies' }")) {
  console.log("  ✓ Manage proxies IS in main auth menu source");
} else {
  console.log("  ✗ Manage proxies NOT in main auth menu - adding...");
  const marker = "{ label: 'Configure models in opencode.json', value: { type: 'configure-models' }, color: 'cyan' },";
  if (authSrc.includes(marker)) {
    const fixed = authSrc.replace(marker, marker + "\n    { label: 'Manage proxies', value: { type: 'proxies' }, color: 'cyan' },");
    fs.writeFileSync(authMenuPath, fixed, "utf-8");
    console.log("  Added Manage proxies ✓");
  }
}

// ============================================================================
// BUILD
// ============================================================================
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

// ============================================================================
// DEPLOY
// ============================================================================
console.log("\n=== deploy ===");
const bundleSrc = path.join(repoDir, "dist", "bundled.js");
const bundleDst = path.join(pluginsDir, "antigravity-auth.js");
fs.copyFileSync(bundleSrc, bundleDst);
console.log("Copied to", bundleDst);

// ============================================================================
// VERIFY
// ============================================================================
console.log("\n=== verify ===");
const bundle = fs.readFileSync(bundleDst, "utf-8");

// Check NO throws remain for rate-limit paths
const hasRateLimitThrow = /throw new Error\(`All \$\{accountCount\}/.test(bundle);
const hasAccountsFailedThrow = bundle.includes('throw lastError || new Error("All Antigravity accounts failed")');
const hasSoftQuotaThrow = /throw new Error\(\s*`Quota protection/.test(bundle);

const checks = [
  ["Default export", bundle.includes("as default")],
  ["Manage proxies in main menu", bundle.includes('label: "Manage proxies", value: { type: "proxies" }')],
  ["Manage proxies in account submenu", bundle.includes('label: "Manage proxies", value: "proxies"')],
  ["Cross-family bypass", bundle.includes("cross-family-bypass")],
  ["Cross-family last-resort", bundle.includes("last-resort")],
  ["Diagnostic toast", bundle.includes("Attempting Gemini fallback")],
  ["NO rate-limit throw", !hasRateLimitThrow],
  ["NO accounts-failed throw", !hasAccountsFailedThrow],
  ["NO soft-quota throw", !hasSoftQuotaThrow],
  ["Synthetic error for rate-limit", bundle.includes("[Antigravity] All")],
  ["Progress toast", bundle.includes("Waiting for")],
  ["proxyIdx default", bundle.includes("proxiesAccountIndex ??")],
];

let allPass = true;
for (const [name, ok] of checks) {
  console.log(`  ${ok ? "✅" : "❌"} ${name}`);
  if (!ok) allPass = false;
}
console.log(`\nBundle: ${(fs.statSync(bundleDst).size / 1024 / 1024).toFixed(2)} MB`);

// Count remaining throws in the main while loop
const throwCount = (bundle.match(/throw new Error\(/g) || []).length;
console.log(`Total throws in bundle: ${throwCount}`);

// ============================================================================
// COMMIT & PUSH
// ============================================================================
console.log("\n=== commit ===");
try {
  execSync("git add -A", { cwd: repoDir, stdio: "inherit" });
  execSync('git commit -m "Fix: replace all rate-limit throws with synthetic responses + disable autoUpdate + diagnostics"', { cwd: repoDir, stdio: "inherit" });
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

console.log("\n=== DONE ===");
if (allPass) {
  console.log("All checks passed ✅");
} else {
  console.log("Some checks FAILED ❌");
}
