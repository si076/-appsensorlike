set outRootDir=..\..\dist\@appsensorlike\appsensorlike_exec_mode_websocket_server
set outDistDir=%outRootDir%\dist
set outHandlerDir=%outDistDir%\execution-modes\appsensor-websocket\server\handler
set baseDir=..\..\src\execution-modes\appsensor-websocket\server

set srcHandlerDir=%baseDir%\handler

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json

del %outHandlerDir%\*.d.ts

copy %srcHandlerDir%\*.json %outHandlerDir%

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%