@echo -- Build Core --
@echo off

set outRootDir=..\..\dist\@appsensorlike\appsensorlike
set outDistDir=%outRootDir%\dist
set outConfigDir=%outDistDir%\configuration-modes\appsensor-configuration-json
set outExecModeDir=%outDistDir%\execution-modes
set outExecModeTestsDir=%outExecModeDir%\tests
set outLoggingDir=%outDistDir%\logging
set baseDir=..\..

set srcConfigDir=..\..\src\configuration-modes\appsensor-configuration-json

set srcExecModesTestsDir=..\..\src\execution-modes\tests

set srcLoggingDir=..\..\src\logging

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json > error.txt

call check_error_file.bat error.txt
if %errorlevel%==1 (
    exit /b 1
)

del %outDistDir%\analysis-engines\appsensor-analysis-rules\test\*.d.ts
del %outConfigDir%\tests\*.d.ts
del %outConfigDir%\client\tests\*.d.ts
del %outConfigDir%\server\tests\*.d.ts
del %outDistDir%\core\tests\*.d.ts
del %outExecModeDir%\appsensor-local\tests\*.d.ts

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%

copy %baseDir%\appsensor-detection-point-descriptions.json %outDistDir%
copy %baseDir%\appsensor-responses-descriptions.json %outDistDir%

copy %srcConfigDir%\server\*.json %outConfigDir%\server
copy %srcConfigDir%\server\tests\*.json %outConfigDir%\server\tests
copy %srcConfigDir%\client\*.json %outConfigDir%\client
copy %srcConfigDir%\client\tests\*.json %outConfigDir%\client\tests

copy %srcExecModesTestsDir%\analysis\*.json %outExecModeTestsDir%\analysis

copy %srcLoggingDir%\*.json %outLoggingDir%

REM update for testing all of dependents
set nodeModulesAppsensorlike=.\node_modules\@appsensorlike\appsensorlike

set storageMySQL=..\..\src\storage-providers\appsensor-storage-mysql
rd %storageMySQL%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %storageMySQL%\%nodeModulesAppsensorlike% /E /i /q

set restServer=..\..\src\rest\server
rd %restServer%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %restServer%\%nodeModulesAppsensorlike% /E /i /q

set execModeRest=..\..\src\execution-modes\appsensor-rest
rd %execModeRest%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %execModeRest%\%nodeModulesAppsensorlike% /E /i /q

set execModeRestClientNode=..\..\src\execution-modes\appsensor-rest\client-node
rd %execModeRestClientNode%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %execModeRestClientNode%\%nodeModulesAppsensorlike% /E /i /q

set execModeRestServer=..\..\src\execution-modes\appsensor-rest\server
rd %execModeRestServer%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %execModeRestServer%\%nodeModulesAppsensorlike% /E /i /q

set websocket=..\..\src\websocket
rd %websocket%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %websocket%\%nodeModulesAppsensorlike% /E /i /q

set appsensorlikeUI=..\..\src\appsensor-ui
rd %appsensorlikeUI%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %appsensorlikeUI%\%nodeModulesAppsensorlike% /E /i /q

set appsensorlikeUIWeb=..\..\src\appsensor-ui\web
rd %appsensorlikeUIWeb%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %appsensorlikeUIWeb%\%nodeModulesAppsensorlike% /E /i /q

set appsensorlikeUIConsole=..\..\src\appsensor-ui\console
rd %appsensorlikeUIConsole%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %appsensorlikeUIConsole%\%nodeModulesAppsensorlike% /E /i /q

set execModeWebsocket=..\..\src\execution-modes\appsensor-websocket
rd %execModeWebsocket%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %execModeWebsocket%\%nodeModulesAppsensorlike% /E /i /q

set execModeWebsocketClientNode=..\..\src\execution-modes\appsensor-websocket\client-node
rd %execModeWebsocketClientNode%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %execModeWebsocketClientNode%\%nodeModulesAppsensorlike% /E /i /q

set execModeWebsocketServer=..\..\src\execution-modes\appsensor-websocket\server
rd %execModeWebsocketServer%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %execModeWebsocketServer%\%nodeModulesAppsensorlike% /E /i /q

set geolocatorsFastGeoip=..\..\src\geolocators\fast-geoip
rd %geolocatorsFastGeoip%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %geolocatorsFastGeoip%\%nodeModulesAppsensorlike% /E /i /q

set reportingEnginesWebsocket=..\..\src\reporting-engines\appsensor-reporting-websocket
rd %reportingEnginesWebsocket%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %reportingEnginesWebsocket%\%nodeModulesAppsensorlike% /E /i /q
