@echo off
set GIT_TERMINAL_PROMPT=0
set GCM_INTERACTIVE=never
set GIT_EDITOR=:
set GIT_PAGER=cat
set PAGER=cat
cd /d "C:\Users\finn\.config\opencode\repos\opencode-antigravity-auth"
git push origin main
echo PUSH DONE
