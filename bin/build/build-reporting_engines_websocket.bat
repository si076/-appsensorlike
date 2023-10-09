set outRootDir=..\..\dist\@appsensorlike\appsensorlike_reporting_engines_websocket
set outDistDir=%outRootDir%\dist
set outServerDir=%outDistDir%\reporting-engines\appsensor-reporting-websocket\server
set outClientDir=%outDistDir%\reporting-engines\appsensor-reporting-websocket\client
set baseDir=..\..\src\reporting-engines\appsensor-reporting-websocket

set srcServerDir=%baseDir%\server
set srcClientDir=%baseDir%\client

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json

copy %srcServerDir%\*.json %outServerDir%
copy %srcClientDir%\*.json %outClientDir%

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%

