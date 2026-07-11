@echo off
echo Adding all changes...
git add .

echo.
set /p msg="Enter commit message (press Enter for 'auto commit'): "
if "%msg%"=="" set msg=auto commit

echo.
echo Committing changes with message: "%msg%"
git commit -m "%msg%"

echo.
echo Pushing to origin main...
git push origin main

echo.
echo Done!
pause
