set outRootDir=..\..\..\dist\@appsensorlike\appsensorlike_storage_mysql
set outDistDir=%outRootDir%\dist
set outStorageMySQLDir=%outDistDir%\storage-providers\appsensor-storage-mysql

rd %outRootDir% /s /q

call tsc -d

del %outStorageMySQLDir%\tests\*.d.ts
REM del following one by one because we want to keep appsensor-storage-mysql.d.ts
del %outStorageMySQLDir%\connection_manager.d.ts
del %outStorageMySQLDir%\DOP.d.ts
del %outStorageMySQLDir%\mapping.d.ts
del %outStorageMySQLDir%\utils.d.ts

mkdir %outStorageMySQLDir%\sql
copy .\sql\* %outStorageMySQLDir%\sql

copy appsensor-storage-mysql-config_schema.json %outStorageMySQLDir%
copy appsensor-storage-mysql-config.json %outStorageMySQLDir%
copy mapping_schema.json %outStorageMySQLDir%
copy mapping.json %outStorageMySQLDir%

copy package.json %outRootDir%
copy Readme.md %outRootDir%