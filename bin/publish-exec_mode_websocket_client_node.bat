
set outRootDir=..\dist\@appsensorlike\appsensorlike_exec_mode_websocket_client_node

set wd=%CD%

cd %outRootDir%

call npm publish --access public

cd %wd%