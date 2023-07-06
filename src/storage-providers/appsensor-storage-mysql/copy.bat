set outRootDir=..\..\..\dist\@appsensorlike\appsensorlike_storage_mysql
set outDistDir=%outRootDir%\dist
set moduleDir=%outDistDir%\storage-providers\appsensor-storage-mysql

mkdir %moduleDir%\sql
copy .\sql\* %moduleDir%\sql

copy appsensor-storage-mysql-config_schema.json %moduleDir%
copy appsensor-storage-mysql-config.json %moduleDir%
copy mapping_schema.json %moduleDir%
copy mapping.json %moduleDir%

copy package.json %outRootDir%
copy Readme.md %outRootDir%