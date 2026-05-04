import { readFileSync, writeFileSync } from 'fs';

const path = 'src/plugin/request.ts';
let lf = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const searchStr = `        stripInjectedDebugFromRequestPayload(requestPayload);
        sanitizeRequestPayloadForAntigravity(requestPayload);`;

const replaceStr = `        stripInjectedDebugFromRequestPayload(requestPayload);
        sanitizeRequestPayloadForAntigravity(requestPayload);

        // DEBUG DUMP
        try {
          if (!isClaude && Array.isArray(requestPayload.contents)) {
            const fs = require('fs');
            fs.appendFileSync(
              require('path').join(require('os').homedir(), '.config', 'opencode', 'gemini-payload-debug.log'),
              "\\n\\n=== PAYLOAD BEFORE ===\\n" + JSON.stringify(requestPayload.contents, null, 2)
            );
          }
        } catch (e) {}`;

if (!lf.includes(searchStr)) {
  console.error("String not found!");
  process.exit(1);
}

lf = lf.replace(searchStr, replaceStr);

const searchStr2 = `        if (headerStyle === "antigravity") {`;
const replaceStr2 = `        // DEBUG DUMP 2
        try {
          if (!isClaude && Array.isArray(requestPayload.contents)) {
            const fs = require('fs');
            fs.appendFileSync(
              require('path').join(require('os').homedir(), '.config', 'opencode', 'gemini-payload-debug.log'),
              "\\n\\n=== PAYLOAD AFTER ===\\n" + JSON.stringify(requestPayload.contents, null, 2)
            );
          }
        } catch (e) {}
        
        if (headerStyle === "antigravity") {`;

if (!lf.includes(searchStr2)) {
  console.error("String 2 not found!");
  process.exit(1);
}

lf = lf.replace(searchStr2, replaceStr2);

writeFileSync(path, lf.replace(/\n/g, '\r\n'), 'utf8');
console.log("Written successfully");
