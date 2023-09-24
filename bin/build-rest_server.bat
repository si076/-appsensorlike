set outRootDir=..\dist\@appsensorlike\appsensorlike_rest_server
set outDistDir=%outRootDir%\dist
set baseDir=..\src\rest\server

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%