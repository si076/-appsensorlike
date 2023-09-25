set outRootDir=..\dist\@appsensorlike\appsensorlike_exec_mode_websocket_client_node
set outDistDir=%outRootDir%\dist
set outEventDir=%outDistDir%\execution-modes\appsensor-websocket\client-node\event
set baseDir=..\src\execution-modes\appsensor-websocket\client-node

set srcEventDir=%baseDir%\event

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json

del %outEventDir%\*.d.ts

copy %srcEventDir%\*.json %outEventDir%

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%