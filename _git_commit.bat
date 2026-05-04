@echo off
set GIT_TERMINAL_PROMPT=0
set GCM_INTERACTIVE=never
set GIT_EDITOR=:
set GIT_PAGER=cat
set PAGER=cat
cd /d "C:\Users\finn\.config\opencode\repos\opencode-antigravity-auth"
git status
git add src/plugin/request.ts dist/index.js _patch_order.mjs
git commit -m "fix: move Gemini turn sanitizer after payload part filtering"
git push origin main
echo DONE
