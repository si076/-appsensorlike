@echo off

set outRootDir=..\..\..\dist\@appsensorlike\appsensorlike_storage_mysql
set outTestsDir=.\dist\storage-providers\appsensor-storage-mysql\tests

set wd=%CD%

REM cd %outRootDir%

call npx run-func %outRootDir%\%outTestsDir%\tests.js runTests

cd %wd%