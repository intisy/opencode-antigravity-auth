import { readFileSync, writeFileSync } from 'fs';

const path = 'src/plugin.ts';
let lf = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const searchStr = `                const debugContext = startAntigravityDebugRequest({
                  originalUrl,
                  resolvedUrl,
                  method: prepared.init.method,
                  headers: prepared.init.headers,
                  body: prepared.init.body,
                  streaming: prepared.streaming,
                  projectId: projectContext.effectiveProjectId,
                });`;

const replaceStr = `                const debugContext = startAntigravityDebugRequest({
                  originalUrl,
                  resolvedUrl,
                  method: prepared.init.method,
                  headers: prepared.init.headers,
                  body: prepared.init.body,
                  streaming: prepared.streaming,
                  projectId: projectContext.effectiveProjectId,
                });
                
                // DEBUG DUMP
                if (family === "gemini") {
                  try {
                    const fs = require('fs');
                    const os = require('os');
                    const logPath = require('path').join(os.homedir(), '.config', 'opencode', 'gemini-final-payload.json');
                    const payloadObj = JSON.parse(prepared.init.body as string);
                    fs.writeFileSync(logPath, JSON.stringify(payloadObj, null, 2));
                  } catch(e) {}
                }`;

if (!lf.includes(searchStr)) {
  console.error("String not found in plugin.ts!");
  process.exit(1);
}

lf = lf.replace(searchStr, replaceStr);

writeFileSync(path, lf.replace(/\n/g, '\r\n'), 'utf8');
console.log("Written successfully");
