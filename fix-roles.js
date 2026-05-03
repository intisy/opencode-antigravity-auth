import { readFileSync, writeFileSync } from "fs";

var file = "C:\\Users\\finn\\.config\\opencode\\repos\\opencode-antigravity-auth\\src\\plugin\\transform\\gemini.ts";
var content = readFileSync(file, "utf-8");

// Convert CRLF to LF to make regex matching easy
content = content.replace(/\r\n/g, "\n");

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

if (content.includes('else if (role === "user")')) {
  console.log("FAILED TO REPLACE");
} else {
  // Convert back to CRLF
  content = content.replace(/\n/g, "\r\n");
  writeFileSync(file, content, "utf-8");
  console.log("SUCCESS");
}
