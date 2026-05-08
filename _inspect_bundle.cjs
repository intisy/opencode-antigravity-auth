const fs = require("fs");
const path = require("path");

const bundlePath = "C:\\Users\\finn\\.config\\opencode\\plugins\\antigravity-auth.js";
const bundle = fs.readFileSync(bundlePath, "utf-8");
const lines = bundle.split("\n");

// Find the exact cross-family fallback section in the compiled bundle
const targets = [
  "cross-family-fallback",
  "crossFamilyFallbackApplied",
  "rate-limited for",
  "All Antigravity accounts failed",
  "temporarily unavailable",
  "cross-family-bypass",
  "createSyntheticErrorResponse",
  "Manage proxies",
  "showAccountDetails",
  "showAuthMenu",
];

for (const t of targets) {
  const matching = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(t)) {
      matching.push({ line: i + 1, text: lines[i].trim().substring(0, 200) });
    }
  }
  console.log(`\n=== "${t}" (${matching.length} matches) ===`);
  for (const m of matching) {
    console.log(`  L${m.line}: ${m.text}`);
  }
}

// Now dump the EXACT cross-family section from bundle (around "cross-family-fallback: claude")
const cfIdx = bundle.indexOf('cross-family-fallback: claude');
if (cfIdx !== -1) {
  const start = Math.max(0, cfIdx - 500);
  const end = Math.min(bundle.length, cfIdx + 2000);
  const section = bundle.substring(start, end);
  console.log("\n\n=== CROSS-FAMILY FALLBACK SECTION (bundle) ===");
  console.log(section);
}

// Dump the rate-limit throw section
const throwIdx = bundle.indexOf('rate-limited for ${family}');
if (throwIdx !== -1) {
  const start = Math.max(0, throwIdx - 800);
  const end = Math.min(bundle.length, throwIdx + 400);
  console.log("\n\n=== RATE LIMIT THROW SECTION ===");
  console.log(bundle.substring(start, end));
}

// Check how many throws exist in account exhaustion paths  
const throwPattern = /throw new Error\([^)]*rate.limited/g;
const throwMatches = bundle.match(throwPattern) || [];
console.log(`\n\n=== THROW patterns matching 'rate.limited' (${throwMatches.length}) ===`);
for (const m of throwMatches) {
  console.log(`  ${m.substring(0, 150)}`);
}
