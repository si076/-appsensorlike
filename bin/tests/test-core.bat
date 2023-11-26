@echo off

set moduleDir=..\..

set distDir=.\dist
set srcDir=.\src


set configServerDir=.\configuration-modes\appsensor-configuration-json\server
set configClientDir=.\configuration-modes\appsensor-configuration-json\client
set testsDir=.\tests

set outDistDir=%distDir%\core\tests
set outLoggingDir=%outDistDir%\logging

set srcLoggingDir=%srcDir%\logging

set sd=%CD%

cd %moduleDir%

set md=%CD%

echo ---
echo "Compiling .ts files..."
call tsc -p tsconfig-tests.json

echo ---
echo Copying config files
copy %srcLoggingDir%\*.json %outLoggingDir%
copy %srcDir%\%configServerDir%\*.json %outDistDir%\%configServerDir% 
copy %srcDir%\%configClientDir%\*.json %outDistDir%\%configClientDir%
copy %srcDir%\%configServerDir%\%testsDir%\*.json %outDistDir%\%configServerDir%\%testsDir% 
copy %srcDir%\%configClientDir%\%testsDir%\*.json %outDistDir%\%configClientDir%\%testsDir%

echo ---
echo "Running tests..."
cd %outDistDir%
call npx run-func %testsDir%\tests.js runTests a
set errLevel=%errorlevel%

echo ---
echo Copying log files
set logsDir=%sd%\logs\core
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