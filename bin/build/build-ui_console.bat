set outRootDir=..\..\dist\@appsensorlike\appsensorlike_ui_console
set outDistDir=%outRootDir%\dist
set outConsoleDir=%outDistDir%\appsensor-ui\console
set baseDir=..\..\src\appsensor-ui\console

rd %outRootDir% /s /q

call tsc -p %baseDir%\tsconfig.json

copy %baseDir%\appsensor-console-ui-settings.json %outConsoleDir%
copy %baseDir%\appsensor-detection-point-descriptions.json %outConsoleDir%
copy %baseDir%\appsensor-responses-descriptions.json %outConsoleDir%


copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%