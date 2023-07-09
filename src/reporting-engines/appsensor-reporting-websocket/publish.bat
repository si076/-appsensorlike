set outRootDir=..\..\..\dist\@appsensorlike\appsensorlike_reporting_engines_websocket

set wd=%CD%

cd %outRootDir%

call npm publish --access public

cd %wd%