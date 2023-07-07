set outRootDir=.\dist\@appsensorlike\appsensorlike
set outDistDir=%outRootDir%\dist
set outConfigDir=%outDistDir%\configuration-modes\appsensor-configuration-json
set outExecModeDir=%outDistDir%\execution-modes
set outExecModeTestsDir=%outExecModeDir%\tests
set outLoggingDir=%outDistDir%\logging

set srcConfigDir=.\src\configuration-modes\appsensor-configuration-json

set srcExecModesTestsDir=.\src\execution-modes\tests

set srcLoggingDir=.\src\logging

rd %outRootDir% /s /q

call tsc -d

del %outDistDir%\analysis-engines\appsensor-analysis-rules\test\*.d.ts
del %outConfigDir%\tests\*.d.ts
del %outConfigDir%\client\tests\*.d.ts
del %outConfigDir%\server\tests\*.d.ts
del %outDistDir%\core\tests\*.d.ts
del %outExecModeDir%\appsensor-local\tests\*.d.ts
del %outExecModeTestsDir%\*.d.ts
del %outExecModeTestsDir%\analysis\*.d.ts

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

