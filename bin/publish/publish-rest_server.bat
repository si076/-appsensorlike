set outRootDir=..\..\dist\@appsensorlike\appsensorlike_rest_server

set wd=%CD%

cd %outRootDir%

call npm publish --access public

cd %wd%