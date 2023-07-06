set outRootDir=.\dist\@appsensorlike\appsensorlike
set outDistDir=%outRootDir%\dist
set outConfigDir=%outDistDir%\configuration-modes\appsensor-configuration-json
set outExecModeTestsDir=%outDistDir%\execution-modes\tests
set outLoggingDir=%outDistDir%\logging

set srcConfigDir=.\src\configuration-modes\appsensor-configuration-json

set srcExecModesTestsDir=.\src\execution-modes\tests

set srcLoggingDir=.\src\logging

call tsc -d

copy package.json %outRootDir%
copy Readme.md %outRootDir%

copy appsensor-detection-point-descriptions.json %outDistDir%
copy appsensor-responses-descriptions.json %outDistDir%

copy %srcConfigDir%\server\*.json %outConfigDir%\server
copy %srcConfigDir%\server\tests\*.json %outConfigDir%\server\tests
copy %srcConfigDir%\client\*.json %outConfigDir%\client
copy %srcConfigDir%\client\tests\*.json %outConfigDir%\client\tests

copy %srcExecModesTestsDir%\analysis\*.json %outExecModeTestsDir%\analysis

copy %srcLoggingDir%\*.json %outLoggingDir%

