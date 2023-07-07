@echo off

set outRootDir=.\dist\@appsensorlike\appsensorlike
set outAnalysisRulesTestsDir=.\dist\analysis-engines\appsensor-analysis-rules\test
set outConfigTestsDir=.\dist\configuration-modes\appsensor-configuration-json\tests
set outCoreTestsDir=.\dist\core\tests
set outExecModeTestsDir=.\dist\execution-modes\appsensor-local\tests

set wd=%CD%

cd %outRootDir%

call npx run-func %outAnalysisRulesTestsDir%\tests.js runTests
call npx run-func %outConfigTestsDir%%\tests.js runTests
call npx run-func %outCoreTestsDir%\tests.js runTests
call npx run-func %outExecModeTestsDir%\tests.js runTests

cd %wd%