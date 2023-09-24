set outRootDir=..\dist\@appsensorlike\appsensorlike_ui_web

set wd=%CD%

cd %outRootDir%

call npm publish --access public

cd %wd%