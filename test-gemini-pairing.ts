import { sanitizeGeminiContents, fixGeminiToolPairing } from "./src/plugin/transform/gemini";
import { readFileSync } from "fs";

// Mock the compaction scenario
const payload = {
  contents: [
    { role: "user", parts: [{ text: "first prompt" }] },
    { role: "model", parts: [{ functionCall: { name: "test", args: {} } }] },
    { role: "user", parts: [{ functionResponse: { name: "test", response: {} } }] },
    // After compaction, OpenCode drops older turns. But let's assume it drops the functionResponse!
    // What if the compaction drops the functionResponse, leaving ONLY the model functionCall at the end?
    { role: "model", parts: [{ functionCall: { name: "test2", args: {} } }] },
    { role: "user", parts: [{ text: "Continue" }] }
  ]
};

const c1 = sanitizeGeminiContents(payload.contents);
const c2 = fixGeminiToolPairing(c1);

console.log(JSON.stringify(c2, null, 2));
