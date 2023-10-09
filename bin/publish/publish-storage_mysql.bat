set outRootDir=..\..\dist\@appsensorlike\appsensorlike_storage_mysql

set wd=%CD%

cd %outRootDir%

call npm publish --access public

cd %wd%