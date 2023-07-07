set outRootDir=.\dist\@appsensorlike\appsensorlike

set wd=%CD%

cd %outRootDir%

call npm publish --access public

cd %wd%