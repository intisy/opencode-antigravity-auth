const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const repoDir = "C:\\Users\\finn\\.config\\opencode\\repos\\opencode-antigravity-auth";
const pluginsDir = "C:\\Users\\finn\\.config\\opencode\\plugins";

console.log("=== FIX 3: Cross-family fallback bypass + Manage proxies in main menu ===\n");

function normalizeEOL(s) { return s.replace(/\r\n/g, "\n"); }
function toCRLF(s) { return s.replace(/(?<!\r)\n/g, "\r\n"); }

// ============================================================================
// FIX 1: plugin.ts
// ============================================================================
console.log("--- plugin.ts ---");
const pluginPath = path.join(repoDir, "src", "plugin.ts");
let pSrc = normalizeEOL(fs.readFileSync(pluginPath, "utf-8"));
let pChanges = 0;

// --- 1a: Insert cross-family bypass AFTER the allowQuotaFallback block ---
// After account selection with alternate header style fails, but BEFORE the
// cross-family fallback section. This catches the case where we already
// switched to gemini (crossFamilyFallbackApplied=true) but hybrid filters
// blocked all accounts on the NEXT iteration.
const M1A = [
  '                );',
  '              }',
  '            }',
  '            ',
  '            if (!account) {',
  '              // Cross-family fallback: if Claude is fully rate-limited, try Gemini',
].join("\n");

const R1A = [
  '                );',
  '              }',
  '            }',
  '',
  '            // Cross-family bypass: when already switched to gemini but hybrid filters block all accounts',
  '            if (!account && crossFamilyFallbackApplied) {',
  '              const allEnabled = accountManager.getEnabledAccounts();',
  '              if (allEnabled.length > 0) {',
  '                account = allEnabled[0];',
  '                pushDebug(`cross-family-bypass: forced pick idx=${account.index} (global filters overridden)`);',
  '              }',
  '            }',
  '            ',
  '            if (!account) {',
  '              // Cross-family fallback: if Claude is fully rate-limited, try Gemini',
].join("\n");

if (pSrc.includes(M1A) && !pSrc.includes("cross-family-bypass: forced pick")) {
  pSrc = pSrc.replace(M1A, R1A);
  pChanges++;
  console.log("  1a: Inserted cross-family bypass after account selection ✓");
} else if (pSrc.includes("cross-family-bypass: forced pick")) {
  console.log("  1a: Already applied");
} else {
  console.log("  1a: MARKER NOT FOUND — dumping context");
  const idx = pSrc.indexOf("// Cross-family fallback: if Claude is fully rate-limited");
  if (idx !== -1) {
    const before = pSrc.substring(Math.max(0, idx - 300), idx);
    console.log("  Context before marker:\n" + before.split("\n").slice(-6).map(l => "    |" + l).join("\n"));
  }
}

// --- 1b: Add last-resort in cross-family section ---
// After the altStyle getCurrentOrNextForFamily, add a last-resort that
// bypasses ALL strategy filters.
const M1B = [
  '                    100, softQuotaCacheTtlMs',
  '                  );',
  '                }',
  '                ',
  '                if (geminiAccount) {',
  '                  urlString = newUrlString;',
].join("\n");

const R1B = [
  '                    100, softQuotaCacheTtlMs',
  '                  );',
  '                }',
  '                // Last resort: bypass ALL strategy filters (health, tokens, cooldown, lease)',
  '                if (!geminiAccount) {',
  '                  const allEnabled = accountManager.getEnabledAccounts();',
  '                  if (allEnabled.length > 0) {',
  '                    geminiAccount = allEnabled[0];',
  '                    pushDebug(`cross-family-fallback: last-resort idx=${geminiAccount.index}`);',
  '                  }',
  '                }',
  '                ',
  '                if (geminiAccount) {',
  '                  urlString = newUrlString;',
].join("\n");

if (pSrc.includes(M1B) && !pSrc.includes("cross-family-fallback: last-resort")) {
  pSrc = pSrc.replace(M1B, R1B);
  pChanges++;
  console.log("  1b: Added last-resort account pick in cross-family section ✓");
} else if (pSrc.includes("cross-family-fallback: last-resort")) {
  console.log("  1b: Already applied");
} else {
  console.log("  1b: MARKER NOT FOUND");
  // Try alternate whitespace
  const alt = M1B.replace(/                /g, "  ".repeat(8));
  if (pSrc.includes(alt)) {
    console.log("  1b: Found with different indentation");
  }
}

// --- 1c: Handle undefined proxyIdx ---
// When "Manage proxies" is selected from the main menu (not account submenu),
// proxiesAccountIndex is undefined. Default to activeIndex or 0.
const M1C = '                if (menuResult.mode === "proxies") {\n                  const proxyIdx = menuResult.proxiesAccountIndex;';
const R1C = '                if (menuResult.mode === "proxies") {\n                  const proxyIdx = menuResult.proxiesAccountIndex ?? (existingStorage.activeIndex ?? 0);';

if (pSrc.includes(M1C)) {
  pSrc = pSrc.replace(M1C, R1C);
  pChanges++;
  console.log("  1c: Fixed proxyIdx default to activeIndex ✓");
} else if (pSrc.includes("proxiesAccountIndex ??")) {
  console.log("  1c: Already applied");
} else {
  console.log("  1c: MARKER NOT FOUND");
}

// --- 1d: When crossFamilyFallbackApplied and ALL accounts fail, return synthetic error ---
// instead of throwing (which causes OpenCode to retry 5x)
const M1D = [
  '              const strictWait = !allowQuotaFallback;',
  '              // All accounts are rate-limited - wait and retry',
].join("\n");

const R1D = [
  '              // If cross-family fallback already applied and we STILL can\'t find an account,',
  '              // return a synthetic error response instead of throwing (prevents OpenCode 5x retry)',
  '              if (crossFamilyFallbackApplied) {',
  '                const errorMessage = `[Antigravity Error] All accounts are temporarily unavailable.\\n\\nClaude is rate-limited and Gemini accounts are blocked by health/cooldown filters.\\nPlease wait a few minutes and try again, or add more accounts with \\`opencode auth login\\`.`;',
  '                return createSyntheticErrorResponse(errorMessage, model ?? "unknown");',
  '              }',
  '',
  '              const strictWait = !allowQuotaFallback;',
  '              // All accounts are rate-limited - wait and retry',
].join("\n");

if (pSrc.includes(M1D) && !pSrc.includes("cross-family fallback already applied")) {
  pSrc = pSrc.replace(M1D, R1D);
  pChanges++;
  console.log("  1d: Added synthetic error return for cross-family exhaustion ✓");
} else if (pSrc.includes("cross-family fallback already applied")) {
  console.log("  1d: Already applied");
} else {
  console.log("  1d: MARKER NOT FOUND");
}

if (pChanges > 0) {
  fs.writeFileSync(pluginPath, toCRLF(pSrc), "utf-8");
  console.log(`  Written ${pChanges} fix(es) to plugin.ts`);
} else {
  console.log("  No changes to plugin.ts");
}

// ============================================================================
// FIX 2: auth-menu.ts - Add "Manage proxies" to main menu
// ============================================================================
console.log("\n--- auth-menu.ts ---");
const authMenuPath = path.join(repoDir, "src", "plugin", "ui", "auth-menu.ts");
let aSrc = normalizeEOL(fs.readFileSync(authMenuPath, "utf-8"));
let aChanges = 0;

const M2 = "    { label: 'Configure models in opencode.json', value: { type: 'configure-models' }, color: 'cyan' },";
const R2 = "    { label: 'Configure models in opencode.json', value: { type: 'configure-models' }, color: 'cyan' },\n    { label: 'Manage proxies', value: { type: 'proxies' }, color: 'cyan' },";

if (aSrc.includes(M2) && !aSrc.includes("{ label: 'Manage proxies', value: { type: 'proxies' }")) {
  aSrc = aSrc.replace(M2, R2);
  aChanges++;
  console.log("  Added 'Manage proxies' to main auth menu ✓");
} else if (aSrc.includes("{ label: 'Manage proxies', value: { type: 'proxies' }")) {
  console.log("  Already has 'Manage proxies' in main menu");
} else {
  console.log("  MARKER NOT FOUND");
}

if (aChanges > 0) {
  fs.writeFileSync(authMenuPath, toCRLF(aSrc), "utf-8");
  console.log(`  Written ${aChanges} fix(es) to auth-menu.ts`);
}

// ============================================================================
// FIX 3: cli.ts - Add proxies option to fallback menu
// ============================================================================
console.log("\n--- cli.ts ---");
const cliPath = path.join(repoDir, "src", "plugin", "cli.ts");
let cSrc = normalizeEOL(fs.readFileSync(cliPath, "utf-8"));
let cChanges = 0;

// 3a: Update prompt text
const M3A = '      const answer = await rl.question("(a)dd new, (f)resh start, (c)heck quotas, (v)erify account, (va) verify all? [a/f/c/v/va]: ");';
const R3A = '      const answer = await rl.question("(a)dd new, (f)resh start, (c)heck quotas, (v)erify, (va) verify all, (p) proxies? [a/f/c/v/va/p]: ");';

if (cSrc.includes(M3A)) {
  cSrc = cSrc.replace(M3A, R3A);
  cChanges++;
  console.log("  3a: Updated fallback menu prompt with (p) option ✓");
} else {
  console.log("  3a: Already applied or MARKER NOT FOUND");
}

// 3b: Add handler
const M3B = '      if (normalized === "va" || normalized === "verify-all" || normalized === "all") {\n        return { mode: "verify-all", verifyAll: true };\n      }';
const R3B = '      if (normalized === "va" || normalized === "verify-all" || normalized === "all") {\n        return { mode: "verify-all", verifyAll: true };\n      }\n      if (normalized === "p" || normalized === "proxies") {\n        return { mode: "proxies" };\n      }';

if (cSrc.includes(M3B) && !cSrc.includes('normalized === "p"')) {
  cSrc = cSrc.replace(M3B, R3B);
  cChanges++;
  console.log("  3b: Added (p) proxies handler ✓");
} else {
  console.log("  3b: Already applied or MARKER NOT FOUND");
}

if (cChanges > 0) {
  fs.writeFileSync(cliPath, toCRLF(cSrc), "utf-8");
  console.log(`  Written ${cChanges} fix(es) to cli.ts`);
}

// ============================================================================
// BUILD
// ============================================================================
console.log("\n=== tsc ===");
try {
  execSync("bun run build", { cwd: repoDir, stdio: "inherit" });
  console.log("tsc OK");
} catch (e) {
  console.error("tsc FAILED:", e.message.slice(0, 300));
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
const checks = [
  ["Default export", "as default"],
  ["Manage proxies in menu", "Manage proxies"],
  ["Cross-family 400 handler", "Cross-family fallback failed"],
  ["Progress toast", "Waiting for"],
  ["Cross-family bypass code", "cross-family-bypass"],
  ["Last-resort pick code", "last-resort"],
  ["Synthetic error for exhaustion", "temporarily unavailable"],
  ["proxyIdx default", "proxiesAccountIndex ??"],
];
let allPass = true;
for (const [name, pat] of checks) {
  const found = bundle.includes(pat);
  console.log(`  ${found ? "✅" : "❌"} ${name}`);
  if (!found) allPass = false;
}
console.log(`\nBundle: ${(fs.statSync(bundleDst).size / 1024 / 1024).toFixed(2)} MB`);

// ============================================================================
// COMMIT & PUSH
// ============================================================================
console.log("\n=== commit ===");
try {
  execSync("git add src/plugin.ts src/plugin/ui/auth-menu.ts src/plugin/cli.ts", { cwd: repoDir, stdio: "inherit" });
  execSync('git commit -m "Fix: cross-family fallback bypass filters + manage proxies in main menu"', { cwd: repoDir, stdio: "inherit" });
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

console.log("\n=== SUMMARY ===");
console.log(`Plugin changes: ${pChanges}, Auth menu: ${aChanges}, CLI: ${cChanges}`);
if (allPass) {
  console.log("All verifications PASSED ✅");
} else {
  console.log("Some verifications FAILED ❌");
}
