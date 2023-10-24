@echo -- Build Exec Mode Websocket Server --
@echo off

set outRootDir=..\..\dist\@appsensorlike\appsensorlike_exec_mode_websocket_server
set outDistDir=%outRootDir%\dist
set outHandlerDir=%outDistDir%\execution-modes\appsensor-websocket\server\handler
set baseDir=..\..\src\execution-modes\appsensor-websocket\server

set srcHandlerDir=%baseDir%\handler

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json > error.txt

call check_error_file.bat error.txt
if %errorlevel%==1 (
    exit /b 1
)

del %outHandlerDir%\*.d.ts

copy %srcHandlerDir%\*.json %outHandlerDir%

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%