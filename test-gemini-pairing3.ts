import { sanitizeGeminiContents, fixGeminiToolPairing } from "./src/plugin/transform/gemini";

const payload = {
  contents: [
    { role: "user", parts: [{ text: "first prompt" }] },
    { role: "model", parts: [{ functionCall: { name: "test", args: {} } }] },
    { role: "user", parts: [{ text: "Continue" }] }
  ]
};

let c = sanitizeGeminiContents(payload.contents);
c = fixGeminiToolPairing(c);
c = sanitizeGeminiContents(c);

console.log(JSON.stringify(c, null, 2));
