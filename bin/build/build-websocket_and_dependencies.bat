@echo -- Build Websocket And Dependencies --
@echo off

set errorFile=error.txt
del %errorFile%

call build-websocket.bat
if %errorlevel%==1 (
@echo Error on building websocket! 
exit /b 1 
)

call build-reporting_engines_websocket.bat
if %errorlevel%==1 (
@echo Error on building reporting engines websocket! 
exit /b 1 
)

call build-exec_mode_websocket_client_node.bat
if %errorlevel%==1 (
@echo Error on building exec mode websocket client node! 
exit /b 1 
)

call build-exec_mode_websocket_server.bat
if %errorlevel%==1 (
@echo Error on building exec mode websocket server! 
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