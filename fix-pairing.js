import { readFileSync, writeFileSync } from "fs";

var file = "C:\\Users\\finn\\.config\\opencode\\repos\\opencode-antigravity-auth\\src\\plugin\\transform\\gemini.ts";
var content = readFileSync(file, "utf-8");

content = content.replace(
  /    \}\n  \}\n\n  return result;\n\}/g,
  `    }
  }

  // Re-sanitize to separate any mixed turns created by injecting functionResponses into text turns
  return sanitizeGeminiContents(result);
}`
);

writeFileSync(file, content, "utf-8");
console.log("Fixed fixGeminiToolPairing");
