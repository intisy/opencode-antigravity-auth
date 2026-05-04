import { sanitizeGeminiContents, fixGeminiToolPairing } from "./src/plugin/transform/gemini";

const payload = {
  contents: [
    { role: "user", parts: [{ text: "first prompt" }] },
    { role: "model", parts: [{ functionCall: { name: "test", args: {} } }] },
    { role: "user", parts: [{ text: "Continue" }] }
  ]
};

// Original order (buggy):
const c1 = sanitizeGeminiContents(payload.contents);
const c2 = fixGeminiToolPairing(c1);
console.log("Buggy order:", JSON.stringify(c2, null, 2));

// Fixed order:
const fixed1 = fixGeminiToolPairing(payload.contents);
const fixed2 = sanitizeGeminiContents(fixed1);
console.log("\nFixed order:", JSON.stringify(fixed2, null, 2));
