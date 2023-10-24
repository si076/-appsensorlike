@echo -- Build Reporting Engines Websocket --
@echo off

set outRootDir=..\..\dist\@appsensorlike\appsensorlike_reporting_engines_websocket
set outDistDir=%outRootDir%\dist
set outServerDir=%outDistDir%\reporting-engines\appsensor-reporting-websocket\server
set outClientDir=%outDistDir%\reporting-engines\appsensor-reporting-websocket\client
set baseDir=..\..\src\reporting-engines\appsensor-reporting-websocket

set srcServerDir=%baseDir%\server
set srcClientDir=%baseDir%\client

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json > error.txt

call check_error_file.bat error.txt
if %errorlevel%==1 (
    exit /b 1
)

copy %srcServerDir%\*.json %outServerDir%
copy %srcClientDir%\*.json %outClientDir%

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%

REM update for testing all of dependents
set nodeModulesAppsensorlike=.\node_modules\@appsensorlike\appsensorlike_reporting_engines_websocket

set appsensorlikeUIWeb=..\..\src\appsensor-ui\web
rd %appsensorlikeUIWeb%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %appsensorlikeUIWeb%\%nodeModulesAppsensorlike% /E /i /q

set appsensorlikeUIConsole=..\..\src\appsensor-ui\console
rd %appsensorlikeUIConsole%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %appsensorlikeUIConsole%\%nodeModulesAppsensorlike% /E /i /q