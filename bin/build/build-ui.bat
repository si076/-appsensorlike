set outRootDir=..\..\dist\@appsensorlike\appsensorlike_ui
set outDistDir=%outRootDir%\dist
set outMySQLDir=%outDistDir%\appsensor-ui\security\mysql
set outSQLDir=%outMySQLDir%\sql
set baseDir=..\..\src\appsensor-ui

set srcMySQLDir=%baseDir%\security\mysql
set srcSQLDir=%srcMySQLDir%\sql

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json

copy %srcMySQLDir%\*.json %outMySQLDir%

mkdir %outSQLDir%
copy %srcSQLDir%\tables.sql %outSQLDir%

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%

