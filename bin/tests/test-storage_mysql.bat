@echo off

set moduleDir=..\..\src\storage-providers\appsensor-storage-mysql

set outDistDir=.\dist
set outStorageMySQLDir=%outDistDir%\storage-providers\appsensor-storage-mysql
set outTestsDir=%outStorageMySQLDir%\tests

set srcTestsDir=.\tests

set sd=%CD%

cd %moduleDir%

set md=%CD%

echo "Compiling .ts files..."
call tsc -p tsconfig-tests.json

echo "Copying config files..."
copy %srcTestsDir%\appsensor-storage-mysql-config_schema.json %outStorageMySQLDir%
copy %srcTestsDir%\appsensor-storage-mysql-config.json %outStorageMySQLDir%
copy .\mapping_schema.json %outStorageMySQLDir%
copy .\mapping.json %outStorageMySQLDir%

echo "Running tests..."
cd %outStorageMySQLDir%
call npx run-func %srcTestsDir%/tests.js runTestsExecModeLocal a

set logsDir=%sd%\logs\storage_mysql 
rd %logsDir% /s /q
mkdir %logsDir%
copy *.log %logsDir%

cd %md%

rd %outDistDir% /s /q

cd %sd%