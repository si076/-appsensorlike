set outRootDir=..\..\dist\@appsensorlike\appsensorlike_websocket
set outDistDir=%outRootDir%\dist

rd %outRootDir% /s /q

call tsc -d

copy package.json %outRootDir%
copy Readme.md %outRootDir%

