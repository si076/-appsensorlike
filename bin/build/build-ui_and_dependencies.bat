@echo -- Build UI And Dependencies --
@echo off

set errorFile=error.txt
del %errorFile%

call build-ui.bat
if %errorlevel%==1 (
@echo Error on building ui! 
exit /b 1 
)

call build-ui_console.bat
if %errorlevel%==1 (
@echo Error on building ui console! 
exit /b 1 
)

call build-ui_web.bat
if %errorlevel%==1 (
@echo Error on building ui web! 
exit /b 1 
)