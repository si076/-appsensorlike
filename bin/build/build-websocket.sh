echo -- Build Websocket --


outRootDir=../../dist/@appsensorlike/appsensorlike_websocket
outDistDir=$outRootDir/dist
baseDir=../../src/websocket

rm -r $outRootDir

../../node_modules/.bin/tsc -d -p $baseDir/tsconfig.json > error.txt

sh check_error_file.sh error.txt
errLevel=$?
if [ $errLevel == 1 ]
then 
    exit 1
fi

cp $baseDir/package.json $outRootDir
cp $baseDir/Readme.md $outRootDir

#update for testing all of dependents
nodeModulesAppsensorlike=./node_modules/@appsensorlike/appsensorlike_websocket

execModeWebsocket=../../src/execution-modes/appsensor-websocket
rm -r $execModeWebsocket/$nodeModulesAppsensorlike
cp -r $outRootDir $execModeWebsocket/$nodeModulesAppsensorlike

execModeWebsocketClientNode=../../src/execution-modes/appsensor-websocket/client-node
rm -r $execModeWebsocketClientNode/$nodeModulesAppsensorlike
cp -r $outRootDir $execModeWebsocketClientNode/$nodeModulesAppsensorlike

execModeWebsocketServer=../../src/execution-modes/appsensor-websocket/server
rm -r $execModeWebsocketServer/$nodeModulesAppsensorlike
cp -r $outRootDir $execModeWebsocketServer/$nodeModulesAppsensorlike

reportingEnginesWebsocket=../../src/reporting-engines/appsensor-reporting-websocket
rm -r $reportingEnginesWebsocket/$nodeModulesAppsensorlike
cp -r $outRootDir $reportingEnginesWebsocket/$nodeModulesAppsensorlike
