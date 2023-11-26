@echo off

set moduleDir=..\..\src\geolocators\fast-geoip

set outDistDir=.\dist
set outFastGeoipDir=%outDistDir%\geolocators\fast-geoip

set srcTestsDir=.\tests

set sd=%CD%

cd %moduleDir%

set md=%CD%

echo ---
echo "Compiling .ts files..."
call tsc -p tsconfig-tests.json

echo ---
echo "Running tests..."
cd %outFastGeoipDir%
call npx run-func %srcTestsDir%/tests.js runTests
set errLevel=%errorlevel%

echo ---
echo Copying log files
set logsDir=%sd%\logs\geolocators_fast_geoip 
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