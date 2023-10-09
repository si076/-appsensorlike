set outRootDir=..\..\dist\@appsensorlike\appsensorlike_exec_mode_websocket_server

set wd=%CD%

cd %outRootDir%

call npm publish --access public

cd %wd%