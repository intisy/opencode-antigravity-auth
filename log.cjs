const { execSync } = require('child_process');
try {
  console.log(execSync('git log --oneline -n 10', { cwd: 'C:/Users/finn/.config/opencode/repos/opencode-antigravity-auth', encoding: 'utf8' }));
} catch (e) { console.error(e.message); }
