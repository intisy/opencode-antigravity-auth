const fs = require('fs');
const path = require('path');

// Fix gemini.ts type errors
const geminiPath = path.join(__dirname, 'src/plugin/transform/gemini.ts');
let gemini = fs.readFileSync(geminiPath, 'utf8');

// Fix Phase 2: merged array indexing
gemini = gemini.replace(
  '  // Phase 2: Merge consecutive same-role turns\r\n  const merged: ContentTurn[] = [normalized[0]];\r\n\r\n  for (let i = 1; i < normalized.length; i++) {\r\n    const current = normalized[i];\r\n    const previous = merged[merged.length - 1];\r\n\r\n    if (current.role === previous.role) {\r\n      previous.parts = [...previous.parts, ...current.parts];\r\n    } else {\r\n      merged.push(current);\r\n    }\r\n  }',
  '  // Phase 2: Merge consecutive same-role turns\r\n  const merged: ContentTurn[] = [normalized[0]!];\r\n\r\n  for (let i = 1; i < normalized.length; i++) {\r\n    const current = normalized[i]!;\r\n    const previous = merged[merged.length - 1]!;\r\n\r\n    if (current.role === previous.role) {\r\n      previous.parts = [...previous.parts, ...current.parts];\r\n    } else {\r\n      merged.push(current);\r\n    }\r\n  }'
);

// Fix Phase 3: merged[0] access
gemini = gemini.replace(
  '  // Phase 3: Ensure conversation starts with "user"\r\n  if (merged[0].role !== "user") {',
  '  // Phase 3: Ensure conversation starts with "user"\r\n  if (merged[0]!.role !== "user") {'
);

// Fix Phase 4: result array indexing
gemini = gemini.replace(
  '  // Phase 4: Insert filler turns to enforce strict alternation\r\n  const result: ContentTurn[] = [merged[0]];\r\n\r\n  for (let i = 1; i < merged.length; i++) {\r\n    const current = merged[i];\r\n    const previous = result[result.length - 1];\r\n\r\n    if (current.role === previous.role) {\r\n      const fillerRole = current.role === "model" ? "user" : "model";\r\n      result.push({ role: fillerRole, parts: [{ text: "" }] });\r\n    }\r\n    result.push(current);',
  '  // Phase 4: Insert filler turns to enforce strict alternation\r\n  const result: ContentTurn[] = [merged[0]!];\r\n\r\n  for (let i = 1; i < merged.length; i++) {\r\n    const current = merged[i]!;\r\n    const previous = result[result.length - 1]!;\r\n\r\n    if (current.role === previous.role) {\r\n      const fillerRole = current.role === "model" ? "user" : "model";\r\n      result.push({ role: fillerRole, parts: [{ text: "" }] });\r\n    }\r\n    result.push(current);'
);

fs.writeFileSync(geminiPath, gemini, 'utf8');
console.log('Fixed gemini.ts type errors');

// Fix request.ts type error - cast requestPayload.contents
const reqPath = path.join(__dirname, 'src/plugin/request.ts');
let req = fs.readFileSync(reqPath, 'utf8');

req = req.replace(
  '              requestPayload.contents = sanitizeGeminiContents(requestPayload.contents);\r\n              requestPayload.contents = fixGeminiToolPairing(requestPayload.contents);',
  '              requestPayload.contents = sanitizeGeminiContents(requestPayload.contents as any[]);\r\n              requestPayload.contents = fixGeminiToolPairing(requestPayload.contents as any[]);'
);

fs.writeFileSync(reqPath, req, 'utf8');
console.log('Fixed request.ts type error');
