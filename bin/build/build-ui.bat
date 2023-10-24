@echo -- Build UI --
@echo off

set outRootDir=..\..\dist\@appsensorlike\appsensorlike_ui
set outDistDir=%outRootDir%\dist
set outMySQLDir=%outDistDir%\appsensor-ui\security\mysql
set outSQLDir=%outMySQLDir%\sql
set baseDir=..\..\src\appsensor-ui

set srcMySQLDir=%baseDir%\security\mysql
set srcSQLDir=%srcMySQLDir%\sql

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json > error.txt

call check_error_file.bat error.txt
if %errorlevel%==1 (
    exit /b 1
)

copy %srcMySQLDir%\*.json %outMySQLDir%

mkdir %outSQLDir%
copy %srcSQLDir%\tables.sql %outSQLDir%

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%

REM update for testing all of dependents
set nodeModulesAppsensorlike=.\node_modules\@appsensorlike\appsensorlike_ui

set appsensorlikeUIWeb=..\..\src\appsensor-ui\web
rd %appsensorlikeUIWeb%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %appsensorlikeUIWeb%\%nodeModulesAppsensorlike% /E /i /q

set appsensorlikeUIConsole=..\..\src\appsensor-ui\console
rd %appsensorlikeUIConsole%\%nodeModulesAppsensorlike% /s /q
xcopy %outRootDir% %appsensorlikeUIConsole%\%nodeModulesAppsensorlike% /E /i /q