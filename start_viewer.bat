@echo off
echo Starting local web server using WSL (Linux)...
echo Keep this window open while you view the notes.
start http://localhost:8000
wsl python3 -m http.server 8000
pause
