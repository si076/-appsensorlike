@echo -- Build Storage MySQL --
@echo off

set outRootDir=..\..\dist\@appsensorlike\appsensorlike_storage_mysql
set outDistDir=%outRootDir%\dist
set outStorageMySQLDir=%outDistDir%\storage-providers\appsensor-storage-mysql
set baseDir=..\..\src\storage-providers\appsensor-storage-mysql

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json > error.txt

call check_error_file.bat error.txt
if %errorlevel%==1 (
    exit /b 1
)

del %outStorageMySQLDir%\tests\*.d.ts
REM del following one by one because we want to keep appsensor-storage-mysql.d.ts
del %outStorageMySQLDir%\connection_manager.d.ts
del %outStorageMySQLDir%\DOP.d.ts
del %outStorageMySQLDir%\mapping.d.ts
del %outStorageMySQLDir%\utils.d.ts

mkdir %outStorageMySQLDir%\sql
copy %baseDir%\sql\* %outStorageMySQLDir%\sql

copy %baseDir%\appsensor-storage-mysql-config_schema.json %outStorageMySQLDir%
copy %baseDir%\appsensor-storage-mysql-config.json %outStorageMySQLDir%
copy %baseDir%\mapping_schema.json %outStorageMySQLDir%
copy %baseDir%\mapping.json %outStorageMySQLDir%

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%