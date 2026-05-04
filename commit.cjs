const { execSync } = require('child_process');
const cwd = 'C:/Users/finn/.config/opencode/repos/opencode-antigravity-auth';
try {
  console.log(execSync('git add .', { cwd, encoding: 'utf8' }));
  console.log(execSync('git commit -m "feat: implement lease and proxy rotation for hybrid mode"', { cwd, encoding: 'utf8' }));
  console.log('Commit successful!');
} catch (e) {
  console.log('Error:', e.stdout || e.message);
}
