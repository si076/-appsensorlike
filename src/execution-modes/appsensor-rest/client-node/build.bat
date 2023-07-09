set outRootDir=..\..\..\..\dist\@appsensorlike\appsensorlike_exec_mode_rest_client_node
set outDistDir=%outRootDir%\dist
set outEventDir=%outDistDir%\execution-modes\appsensor-rest\client-node\event

set srcEventDir=..\..\..\..\src\execution-modes\appsensor-rest\client-node\event

rd %outRootDir% /s /q

call tsc -d

del %outEventDir%\*.d.ts

copy %srcEventDir%\*.json %outEventDir%

copy package.json %outRootDir%
copy Readme.md %outRootDir%