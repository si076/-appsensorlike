set outRootDir=..\dist\@appsensorlike\appsensorlike_websocket
set outDistDir=%outRootDir%\dist
set baseDir=..\src\websocket

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%

