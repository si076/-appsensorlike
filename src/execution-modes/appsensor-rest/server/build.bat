set outRootDir=..\..\..\..\dist\@appsensorlike\appsensorlike_exec_mode_rest_server
set outDistDir=%outRootDir%\dist
set outHandlerDir=%outDistDir%\execution-modes\appsensor-rest\server\handler

set srcHandlerDir=..\..\..\..\src\execution-modes\appsensor-rest\server\handler

rd %outRootDir% /s /q

call tsc -d

del %outHandlerDir%\*.d.ts

copy %srcHandlerDir%\*.json %outHandlerDir%

copy package.json %outRootDir%
copy Readme.md %outRootDir%