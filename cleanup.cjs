const fs = require('fs');
const { execSync } = require('child_process');
const cwd = 'C:/Users/finn/.config/opencode/repos/opencode-antigravity-auth';

const toDelete = [
  '_git_commit.bat',
  '_git_commit_2.bat',
  '_git_log.bat',
  '_git_push.bat',
  '_patch_debug.mjs',
  '_patch_plugin_debug.mjs',
  '_patch_second_pass.mjs',
  'apply.js',
  'commit.cjs',
  'fix-pairing.js',
  'rewrite-gemini.js',
  'test-gemini-pairing.ts',
  'test-gemini-pairing2.ts',
  'test-gemini-pairing3.ts',
  'test-gemini-pairing4.ts'
];

for (const file of toDelete) {
  try {
    fs.unlinkSync(cwd + '/' + file);
    console.log('Deleted', file);
  } catch (e) {
    console.log('Could not delete', file, e.message);
  }
}

try {
  console.log(execSync('git add .', { cwd, encoding: 'utf8' }));
  console.log(execSync('git commit -m "chore: clean up temporary script files"', { cwd, encoding: 'utf8' }));
} catch (e) {
  console.log('Commit error:', e.stdout || e.message);
}
