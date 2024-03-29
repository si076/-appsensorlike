@echo -- Build Exec Mode Rest Client Node --
@echo off

set outRootDir=..\..\dist\@appsensorlike\appsensorlike_exec_mode_rest_client_node
set outDistDir=%outRootDir%\dist
set outEventDir=%outDistDir%\execution-modes\appsensor-rest\client-node\event
set baseDir=..\..\src\execution-modes\appsensor-rest\client-node

set srcEventDir=%baseDir%\event

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json > error.txt

call check_error_file.bat error.txt
if %errorlevel%==1 (
    exit /b 1
)

del %outEventDir%\*.d.ts

copy %srcEventDir%\*.json %outEventDir%

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%