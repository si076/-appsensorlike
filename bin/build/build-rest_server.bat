@echo -- Build Rest Server --
@echo off

set outRootDir=..\..\dist\@appsensorlike\appsensorlike_rest_server
set outDistDir=%outRootDir%\dist
set baseDir=..\..\src\rest\server

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json > error.txt

call check_error_file.bat error.txt
if %errorlevel%==1 (
    exit /b 1
)

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%

REM update for testing all of dependents
set nodeModulesAppsensorlike=.\node_modules\@appsensorlike\appsensorlike_rest_server

set execModeRest=..\..\src\execution-modes\appsensor-rest
rd %execModeRest%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %execModeRest%\%nodeModulesAppsensorlike% /E /i /q

set execModeRestServer=..\..\src\execution-modes\appsensor-rest\server
rd %execModeRestServer%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %execModeRestServer%\%nodeModulesAppsensorlike% /E /i /q

set appsensorlikeUIWeb=..\..\src\appsensor-ui\web
rd %appsensorlikeUIWeb%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %appsensorlikeUIWeb%\%nodeModulesAppsensorlike% /E /i /q
