@echo off
echo ========================================
echo   PUSHING CHANGES TO GITHUB
echo ========================================
echo.

cd /d C:\Users\mamun\Desktop\Pinpost

echo Adding all files...
"C:\Program Files\Git\bin\git.exe" add .

echo.
echo Committing changes...
"C:\Program Files\Git\bin\git.exe" commit -m "Fix API proxy with nginx - production ready"

echo.
echo Pushing to GitHub...
"C:\Program Files\Git\bin\git.exe" push origin main

echo.
echo ========================================
echo   DONE! Changes pushed to GitHub
echo ========================================
echo.
echo Now update Hostinger YAML and redeploy!
echo.
pause
