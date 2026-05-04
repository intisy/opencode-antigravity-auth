import { sanitizeGeminiContents } from "./src/plugin/transform/gemini";

const payload = [
  { role: "user", parts: [{ text: "first prompt" }] },
  { role: "model", parts: [{ functionCall: { name: "test", args: {} } }] },
  { role: "user", parts: [{ functionResponse: { name: "test", response: {} } }] },
  { role: "model", parts: [{ text: "acknowledged" }] },
  { role: "user", parts: [{ text: "Continue" }] }
];

const c = sanitizeGeminiContents(payload);
console.log(JSON.stringify(c, null, 2));
