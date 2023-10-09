set outRootDir=..\..\dist\@appsensorlike\appsensorlike_ui

set wd=%CD%

cd %outRootDir%

call npm publish --access public

cd %wd%