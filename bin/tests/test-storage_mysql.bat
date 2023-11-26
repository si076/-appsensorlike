@echo off

set moduleDir=..\..\src\storage-providers\appsensor-storage-mysql

set outDistDir=.\dist
set outStorageMySQLDir=%outDistDir%\storage-providers\appsensor-storage-mysql
set outTestsDir=%outStorageMySQLDir%\tests

set srcTestsDir=.\tests

set sd=%CD%

cd %moduleDir%

set md=%CD%

echo ---
echo "Compiling .ts files..."
call tsc -p tsconfig-tests.json

echo ---
echo "Copying config files..."
copy %srcTestsDir%\appsensor-storage-mysql-config_schema.json %outStorageMySQLDir%
copy %srcTestsDir%\appsensor-storage-mysql-config.json %outStorageMySQLDir%
copy .\mapping_schema.json %outStorageMySQLDir%
copy .\mapping.json %outStorageMySQLDir%

echo ---
echo "Running tests..."
cd %outStorageMySQLDir%
call npx run-func %srcTestsDir%/tests.js runTestsExecModeLocal a
set errLevel=%errorlevel%

echo ---
echo Copying log files
set logsDir=%sd%\logs\storage_mysql 
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