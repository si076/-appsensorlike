@echo -- Build Websocket --
@echo off

set outRootDir=..\..\dist\@appsensorlike\appsensorlike_websocket
set outDistDir=%outRootDir%\dist
set baseDir=..\..\src\websocket

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json > error.txt

call check_error_file.bat error.txt
if %errorlevel%==1 (
    exit /b 1
)

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%

REM update for testing all of dependents
set nodeModulesAppsensorlike=.\node_modules\@appsensorlike\appsensorlike_websocket

set execModeWebsocket=..\..\src\execution-modes\appsensor-websocket
rd %execModeWebsocket%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %execModeWebsocket%\%nodeModulesAppsensorlike% /E /i /q

set execModeWebsocketClientNode=..\..\src\execution-modes\appsensor-websocket\client-node
rd %execModeWebsocketClientNode%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %execModeWebsocketClientNode%\%nodeModulesAppsensorlike% /E /i /q

set execModeWebsocketServer=..\..\src\execution-modes\appsensor-websocket\server
rd %execModeWebsocketServer%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %execModeWebsocketServer%\%nodeModulesAppsensorlike% /E /i /q

set reportingEnginesWebsocket=..\..\src\reporting-engines\appsensor-reporting-websocket
rd %reportingEnginesWebsocket%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %reportingEnginesWebsocket%\%nodeModulesAppsensorlike% /E /i /q
