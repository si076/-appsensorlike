set outRootDir=..\..\dist\@appsensorlike\appsensorlike_ui
set outDistDir=%outRootDir%\dist
set outMySQLDir=%outDistDir%\appsensor-ui\security\mysql
set outSQLDir=%outMySQLDir%\sql

set srcMySQLDir=..\..\src\appsensor-ui\security\mysql
set srcSQLDir=%srcMySQLDir%\sql

rd %outRootDir% /s /q

call tsc -d

copy %srcMySQLDir%\*.json %outMySQLDir%

mkdir %outSQLDir%
copy %srcSQLDir%\tables.sql %outSQLDir%

copy package.json %outRootDir%
copy Readme.md %outRootDir%

