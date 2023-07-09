set outRootDir=..\..\..\dist\@appsensorlike\appsensorlike_reporting_engines_websocket
set outDistDir=%outRootDir%\dist
set outServerDir=%outDistDir%\reporting-engines\appsensor-reporting-websocket\server
set outClientDir=%outDistDir%\reporting-engines\appsensor-reporting-websocket\client

set srcServerDir=.\server
set srcClientDir=.\client

rd %outRootDir% /s /q

call tsc -d

copy %srcServerDir%\*.json %outServerDir%
copy %srcClientDir%\*.json %outClientDir%

copy package.json %outRootDir%
copy Readme.md %outRootDir%

