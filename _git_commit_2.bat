@echo off
set GIT_TERMINAL_PROMPT=0
set GCM_INTERACTIVE=never
set GIT_EDITOR=:
set GIT_PAGER=cat
set PAGER=cat
cd /d "C:\Users\finn\.config\opencode\repos\opencode-antigravity-auth"
git status
git add src/plugin/request.ts dist/index.js
git commit -m "fix: run Gemini sanitizer twice to split mixed turns injected by tool pairing"
git push origin main
echo DONE
