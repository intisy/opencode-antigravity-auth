import { readFileSync, writeFileSync } from "fs";

var file = "C:\\Users\\finn\\.config\\opencode\\repos\\opencode-antigravity-auth\\src\\plugin\\transform\\gemini.ts";
var content = readFileSync(file, "utf-8");

var oldBlock = `    } else if (role === "user") {
      // User turn: keep functionResponse + other parts, eject functionCall
      if (functionCallParts.length > 0) {
        normalized.push({ role: "model", parts: functionCallParts });
      }
      const userParts = [...otherParts, ...functionResponseParts];
      if (userParts.length > 0) {
        normalized.push({ ...content, role: "user", parts: userParts });
      }
    } else {
      normalized.push({ ...content, role, parts });
    }`;

var newBlock = `    } else {
      // User or any other role (tool/system): treat as "user"
      if (functionCallParts.length > 0) {
        normalized.push({ role: "model", parts: functionCallParts });
      }
      const userParts = [...otherParts, ...functionResponseParts];
      if (userParts.length > 0) {
        normalized.push({ ...content, role: "user", parts: userParts });
      }
    }`;

content = content.replace(oldBlock, newBlock);

writeFileSync(file, content, "utf-8");
console.log("Forced all non-model roles to user");
