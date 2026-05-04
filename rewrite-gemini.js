import { readFileSync, writeFileSync } from "fs";

var file = "C:\\Users\\finn\\.config\\opencode\\repos\\opencode-antigravity-auth\\src\\plugin\\transform\\gemini.ts";
var content = readFileSync(file, "utf-8");
content = content.replace(/\\r\\n/g, "\\n");

var oldPhase1 = `    } else {
      // User or any other role (tool/system): treat as "user"
      if (functionCallParts.length > 0) {
        normalized.push({ role: "model", parts: functionCallParts });
      }
      const userParts = [...otherParts, ...functionResponseParts];
      if (userParts.length > 0) {
        normalized.push({ ...content, role: "user", parts: userParts });
      }
    }`;

var newPhase1 = `    } else {
      // User or any other role (tool/system): treat as "user"
      if (functionCallParts.length > 0) {
        normalized.push({ role: "model", parts: functionCallParts });
      }
      if (functionResponseParts.length > 0) {
        normalized.push({ role: "user", parts: functionResponseParts });
      }
      if (otherParts.length > 0) {
        normalized.push({ ...content, role: "user", parts: otherParts });
      }
    }`;

content = content.replace(oldPhase1, newPhase1);

var oldPhase2 = `    if (current.role === previous.role) {
      previous.parts = [...previous.parts, ...current.parts];
    } else {
      merged.push(current);
    }`;

var newPhase2 = `    const hasFunc = (parts: any[]) => parts.some(p => p.functionCall || p.functionResponse || p.function_call || p.function_response);
    const prevFunc = hasFunc(previous.parts);
    const currFunc = hasFunc(current.parts);

    if (current.role === previous.role && prevFunc === currFunc) {
      previous.parts = [...previous.parts, ...current.parts];
    } else {
      merged.push(current);
    }`;

content = content.replace(oldPhase2, newPhase2);

var oldPhase3 = `  // Phase 3: Ensure conversation starts with "user"
  if (merged[0]!.role !== "user") {
    merged.unshift({ role: "user", parts: [{ text: "" }] });
  }`;

var newPhase3 = `  // Phase 3: Ensure conversation starts with "user"
  if (merged[0]!.role !== "user") {
    merged.unshift({ role: "user", parts: [{ text: "acknowledged" }] });
  }`;

content = content.replace(oldPhase3, newPhase3);

var oldPhase4 = `    if (current.role === previous.role) {
      const fillerRole = current.role === "model" ? "user" : "model";
      result.push({ role: fillerRole, parts: [{ text: "" }] });
    }`;

var newPhase4 = `    if (current.role === previous.role) {
      const fillerRole = current.role === "model" ? "user" : "model";
      result.push({ role: fillerRole, parts: [{ text: "acknowledged" }] });
    }`;

content = content.replace(oldPhase4, newPhase4);

content = content.replace(/\\n/g, "\\r\\n");

writeFileSync(file, content, "utf-8");
console.log("Rewritten Gemini sanitizer");
