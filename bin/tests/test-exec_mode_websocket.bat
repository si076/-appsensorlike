@echo off

set moduleDir=..\..\src\execution-modes\appsensor-websocket

set outDistDir=.\dist
set outRestDir=%outDistDir%\execution-modes\appsensor-websocket
set outTestsDir=%outStorageMySQLDir%\tests

set testsDir=.\tests
set handlerDir=.\server\handler
set eventDir=.\client-node\event

set configFile=..\tests\analysis\appsensor-analysis-tests-server-config.json

set sd=%CD%

cd %moduleDir%

set md=%CD%

echo ---
echo "Compiling .ts files..."
call tsc -p tsconfig-tests.json

echo ---
echo "Copying config files..."
copy %configFile% %outRestDir%
copy %handlerDir%\*.json %outRestDir%\%handlerDir%
copy %eventDir%\*.json %outRestDir%\%eventDir%

echo ---
echo "Running tests..."
cd %outRestDir%
call npx run-func %testsDir%/tests.js runTests

echo ---
echo Copying log files
set logsDir=%sd%\logs\exec_mode_websocket 
rd %logsDir% /s /q
mkdir %logsDir%
copy *.log %logsDir%

cd %md%

echo ---
echo Clearing tests dir
rem rd %outDistDir% /s /q

cd %sd%