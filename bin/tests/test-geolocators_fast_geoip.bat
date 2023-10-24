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

cd %md%

echo ---
echo Clearing tests dir
rd %outDistDir% /s /q

cd %sd%