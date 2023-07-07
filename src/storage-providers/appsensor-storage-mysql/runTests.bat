@echo off

set outRootDir=..\..\..\dist\@appsensorlike\appsensorlike_storage_mysql
set outTestsDir=.\dist\storage-providers\appsensor-storage-mysql\tests

set wd=%CD%

cd %outRootDir%

call npx run-func %outTestsDir%\tests.js runTests

cd %wd%