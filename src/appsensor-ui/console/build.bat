set outRootDir=..\..\..\dist\@appsensorlike\appsensorlike_ui_console
set outDistDir=%outRootDir%\dist
set outConsoleDir=%outDistDir%\appsensor-ui\console

set srcConsoleDir=..\..\..\src\appsensor-ui\console

rd %outRootDir% /s /q

call tsc

copy %srcConsoleDir%\appsensor-console-ui-settings.json %outConsoleDir%
copy %srcConsoleDir%\appsensor-detection-point-descriptions.json %outConsoleDir%
copy %srcConsoleDir%\appsensor-responses-descriptions.json %outConsoleDir%


copy package.json %outRootDir%
copy Readme.md %outRootDir%