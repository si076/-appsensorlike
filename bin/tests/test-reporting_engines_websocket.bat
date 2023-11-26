@echo off

set moduleDir=..\..\src\reporting-engines\appsensor-reporting-websocket

set testDir=.\tests
set serverDir=.\server
set clientDir=.\client

set outDistDir=.\dist
set outReportingWebsocketDir=%outDistDir%\reporting-engines\appsensor-reporting-websocket
set outTestsDir=%outReportingWebsocketDir%\tests


set sd=%CD%

cd %moduleDir%

set md=%CD%

echo ---
echo "Compiling .ts files..."
call tsc -p tsconfig-tests.json

echo ---
echo "Copying config files..." 
copy %testDir%\*.json %outTestsDir%
copy %serverDir%\*.json %outReportingWebsocketDir%\%serverDir%
copy %clientDir%\*.json %outReportingWebsocketDir%\%clientDir%
copy %testDir%\*.pem %outReportingWebsocketDir%

echo ---
echo "Running tests..."
cd %outReportingWebsocketDir%
call npx run-func %testDir%/appsensor-reporting-websocket-tests.js runTests
set errLevel=%errorlevel%

echo ---
echo Copying log files
set logsDir=%sd%\logs\reporting_websocket 
rd %logsDir% /s /q
mkdir %logsDir%
copy *.log %logsDir%

cd %md%

echo ---
echo Clearing tests dir
rd %outDistDir% /s /q

cd %sd%

if %errLevel%==1 (
    exit /b 1
)