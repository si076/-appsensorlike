#!/bin/bash

echo -- Build Core --

outRootDir=../../dist/@appsensorlike/appsensorlike
outDistDir=$outRootDir/dist
outConfigDir=$outDistDir/configuration-modes/appsensor-configuration-json
outExecModeDir=$outDistDir/execution-modes
outExecModeTestsDir=$outExecModeDir/tests
outLoggingDir=$outDistDir/logging
baseDir=../..

srcConfigDir=../../src/configuration-modes/appsensor-configuration-json

srcExecModesTestsDir=../../src/execution-modes/tests

srcLoggingDir=../../src/logging

rm -r $outRootDir

../../node_modules/.bin/tsc -d -p $baseDir/tsconfig.json > error.txt

sh check_error_file.sh error.txt
errLevel=$?
if [ $errLevel == 1 ]
then 
    exit 1
fi

rm $outDistDir/analysis-engines/appsensor-analysis-rules/test/*.d.ts
rm $outConfigDir/tests/*.d.ts
rm $outConfigDir/client/tests/*.d.ts
rm $outConfigDir/server/tests/*.d.ts
rm $outDistDir/core/tests/*.d.ts
rm $outExecModeDir/appsensor-local/tests/*.d.ts

cp $baseDir/package.json $outRootDir
cp $baseDir/README.md $outRootDir
cp $baseDir/CHANGELOG.md $outRootDir

cp $baseDir/appsensor-detection-point-descriptions.json $outDistDir
cp $baseDir/appsensor-responses-descriptions.json $outDistDir

cp $srcConfigDir/server/*.json $outConfigDir/server
cp $srcConfigDir/server/tests/*.json $outConfigDir/server/tests
cp $srcConfigDir/client/*.json $outConfigDir/client
cp $srcConfigDir/client/tests/*.json $outConfigDir/client/tests

cp $srcExecModesTestsDir/analysis/*.json $outExecModeTestsDir/analysis

cp $srcLoggingDir/*.json $outLoggingDir

#update for testing all of dependents
nodeModulesAppsensorlike=./node_modules/@appsensorlike/appsensorlike

storageMySQL=../../src/storage-providers/appsensor-storage-mysql
rm -r $storageMySQL/$nodeModulesAppsensorlike
cp -r $outRootDir $storageMySQL/$nodeModulesAppsensorlike

restServer=../../src/rest/server
rm -r $restServer/$nodeModulesAppsensorlike
cp -r $outRootDir $restServer/$nodeModulesAppsensorlike

execModeRest=../../src/execution-modes/appsensor-rest
rm -r $execModeRest/$nodeModulesAppsensorlike
cp -r $outRootDir $execModeRest/$nodeModulesAppsensorlike

execModeRestClientNode=../../src/execution-modes/appsensor-rest/client-node
rm -r $execModeRestClientNode/$nodeModulesAppsensorlike
cp -r $outRootDir $execModeRestClientNode/$nodeModulesAppsensorlike

execModeRestServer=../../src/execution-modes/appsensor-rest/server
rm -r $execModeRestServer/$nodeModulesAppsensorlike
cp -r $outRootDir $execModeRestServer/$nodeModulesAppsensorlike

websocket=../../src/websocket
rm -r $websocket/$nodeModulesAppsensorlike
cp -r $outRootDir $websocket/$nodeModulesAppsensorlike

appsensorlikeUI=../../src/appsensor-ui
rm -r $appsensorlikeUI/$nodeModulesAppsensorlike
cp -r $outRootDir $appsensorlikeUI/$nodeModulesAppsensorlike

appsensorlikeUIWeb=../../src/appsensor-ui/web
rm -r $appsensorlikeUIWeb/$nodeModulesAppsensorlike
cp -r $outRootDir $appsensorlikeUIWeb/$nodeModulesAppsensorlike

appsensorlikeUIConsole=../../src/appsensor-ui/console
rm -r $appsensorlikeUIConsole/$nodeModulesAppsensorlike
cp -r $outRootDir $appsensorlikeUIConsole/$nodeModulesAppsensorlike

execModeWebsocket=../../src/execution-modes/appsensor-websocket
rm -r $execModeWebsocket/$nodeModulesAppsensorlike
cp -r $outRootDir $execModeWebsocket/$nodeModulesAppsensorlike

execModeWebsocketClientNode=../../src/execution-modes/appsensor-websocket/client-node
rm -r $execModeWebsocketClientNode/$nodeModulesAppsensorlike
cp -r $outRootDir $execModeWebsocketClientNode/$nodeModulesAppsensorlike

execModeWebsocketServer=../../src/execution-modes/appsensor-websocket/server
rm -r $execModeWebsocketServer/$nodeModulesAppsensorlike
cp -r $outRootDir $execModeWebsocketServer/$nodeModulesAppsensorlike

geolocatorsFastGeoip=../../src/geolocators/fast-geoip
rm -r $geolocatorsFastGeoip/$nodeModulesAppsensorlike
cp -r $outRootDir $geolocatorsFastGeoip/$nodeModulesAppsensorlike

reportingEnginesWebsocket=../../src/reporting-engines/appsensor-reporting-websocket
rm -r $reportingEnginesWebsocket/$nodeModulesAppsensorlike
cp -r $outRootDir $reportingEnginesWebsocket/$nodeModulesAppsensorlike
