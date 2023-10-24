@echo -- Build Rest Server And Dependencies --
@echo off

set errorFile=error.txt
del %errorFile%


call build-rest_server.bat
if %errorlevel%==1 (
@echo Error on building rest server! 
exit /b 1 
)

call build-exec_mode_rest_server.bat
if %errorlevel%==1 (
@echo Error on building exec mode rest server! 
exit /b 1 
)

call build-ui_web.bat
if %errorlevel%==1 (
@echo Error on building ui web! 
exit /b 1 
)