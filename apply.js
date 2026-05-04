import { readFileSync, writeFileSync } from "fs";

var file = "C:\\Users\\finn\\.config\\opencode\\repos\\opencode-antigravity-auth\\src\\plugin\\transform\\gemini.ts";
var content = readFileSync(file, "utf-8");

// Convert to Unix lines to safely regex
content = content.replace(/\r\n/g, "\n");

// Replace Phase 1 User logic
content = content.replace(
  /const userParts = \[\.\.\.otherParts, \.\.\.functionResponseParts\];\n\s+if \(userParts\.length > 0\) \{\n\s+normalized\.push\(\{ \.\.\.content, role: "user", parts: userParts \}\);\n\s+\}/,
  `if (functionResponseParts.length > 0) {
        normalized.push({ role: "user", parts: functionResponseParts });
      }
      if (otherParts.length > 0) {
        normalized.push({ ...content, role: "user", parts: otherParts });
      }`
);

// Replace Phase 2 logic
content = content.replace(
  /if \(current\.role === previous\.role\) \{\n\s+previous\.parts = \[\.\.\.previous\.parts, \.\.\.current\.parts\];\n\s+\} else \{\n\s+merged\.push\(current\);\n\s+\}/,
  `const hasFunc = (parts: any[]) => parts.some(p => p.functionCall || p.functionResponse || p.function_call || p.function_response);
    const prevFunc = hasFunc(previous.parts);
    const currFunc = hasFunc(current.parts);

    if (current.role === previous.role && prevFunc === currFunc) {
      previous.parts = [...previous.parts, ...current.parts];
    } else {
      merged.push(current);
    }`
);

// Replace Phase 3 logic
content = content.replace(
  /merged\.unshift\(\{ role: "user", parts: \[\{ text: "" \}\] \}\);/,
  `merged.unshift({ role: "user", parts: [{ text: "acknowledged" }] });`
);

// Replace Phase 4 logic
content = content.replace(
  /result\.push\(\{ role: fillerRole, parts: \[\{ text: "" \}\] \}\);/,
  `result.push({ role: fillerRole, parts: [{ text: "acknowledged" }] });`
);

// Write back with CRLF
content = content.replace(/\n/g, "\r\n");
writeFileSync(file, content, "utf-8");
console.log("Done");
