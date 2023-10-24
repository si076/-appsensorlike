@echo -- Build All --
@echo off

set errorFile=error.txt
del %errorFile%

REM ordered according to dependencies
call build-core.bat
if %errorlevel%==1 (
@echo Error on building core!
exit /b 1
)



call build-storage_mysql.bat
if %errorlevel%==1 ( 
@echo Error on building storage mysql!
exit /b 1 
)
call build-exec_mode_rest_client_node.bat
if %errorlevel%==1 (
@echo Error on building rest client node!
exit /b 1 
)
call build-geolocators_fast_geoip.bat
if %errorlevel%==1 (
@echo Error on building geolocators with fast_geoip!
exit /b 1 
)



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