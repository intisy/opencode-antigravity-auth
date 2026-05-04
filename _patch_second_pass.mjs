import { readFileSync, writeFileSync } from 'fs';

const path = 'src/plugin/request.ts';
let lf = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const searchStr = `        if (!isClaude && Array.isArray(requestPayload.contents)) {
          requestPayload.contents = sanitizeGeminiContents(requestPayload.contents as any[]);
          requestPayload.contents = fixGeminiToolPairing(requestPayload.contents as any[]);
        }`;

const replaceStr = `        if (!isClaude && Array.isArray(requestPayload.contents)) {
          requestPayload.contents = sanitizeGeminiContents(requestPayload.contents as any[]);
          requestPayload.contents = fixGeminiToolPairing(requestPayload.contents as any[]);
          // Run sanitizer a second time to split any mixed turns created by fixGeminiToolPairing
          // and enforce strict alternation around newly injected functionResponse turns.
          requestPayload.contents = sanitizeGeminiContents(requestPayload.contents as any[]);
        }`;

if (!lf.includes(searchStr)) {
  console.error("String not found!");
  process.exit(1);
}

lf = lf.replace(searchStr, replaceStr);

writeFileSync(path, lf.replace(/\n/g, '\r\n'), 'utf8');
console.log("Written successfully");
