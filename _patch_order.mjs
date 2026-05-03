import { readFileSync, writeFileSync } from 'fs';

const path = 'src/plugin/request.ts';
let lf = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

// Step 1: Remove sanitizeGeminiContents from old location (inside `} else {` Gemini branch)
const oldBlock = `          } else {
            // Gemini conversation turn sanitization
            if (Array.isArray(requestPayload.contents)) {
              requestPayload.contents = sanitizeGeminiContents(requestPayload.contents as any[]);
              requestPayload.contents = fixGeminiToolPairing(requestPayload.contents as any[]);
            }

            // Gemini-specific tool normalization and feature injection`;
const newBlock = `          } else {
            // Gemini-specific tool normalization and feature injection`;

if (!lf.includes(oldBlock)) {
  console.error('block1 NOT FOUND - search failed');
  process.exit(1);
}
lf = lf.replace(oldBlock, newBlock);
console.log('block1 replaced OK');

// Step 2: Add sanitizeGeminiContents AFTER sanitizeRequestPayloadForAntigravity
const anchor = `        stripInjectedDebugFromRequestPayload(requestPayload);
        sanitizeRequestPayloadForAntigravity(requestPayload);`;
const replacement = `        stripInjectedDebugFromRequestPayload(requestPayload);
        sanitizeRequestPayloadForAntigravity(requestPayload);

        // Gemini conversation turn sanitization (must run AFTER sanitizeRequestPayloadForAntigravity
        // so turns with only invalid parts e.g. type:"compaction" are already removed before
        // structural enforcement. Prevents the post-compaction Gemini 400 turn-ordering error
        // where the compaction model turn is later stripped leaving two consecutive user turns.)
        if (!isClaude && Array.isArray(requestPayload.contents)) {
          requestPayload.contents = sanitizeGeminiContents(requestPayload.contents as any[]);
          requestPayload.contents = fixGeminiToolPairing(requestPayload.contents as any[]);
        }`;

if (!lf.includes(anchor)) {
  console.error('anchor NOT FOUND - search failed');
  process.exit(1);
}
lf = lf.replace(anchor, replacement);
console.log('block2 replaced OK');

writeFileSync(path, lf.replace(/\n/g, '\r\n'), 'utf8');
console.log('Written successfully');
