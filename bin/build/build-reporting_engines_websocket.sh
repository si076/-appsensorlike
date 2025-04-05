echo -- Build Reporting Engines Websocket --


outRootDir=../../dist/@appsensorlike/appsensorlike_reporting_engines_websocket
outDistDir=$outRootDir/dist
outServerDir=$outDistDir/reporting-engines/appsensor-reporting-websocket/server
outClientDir=$outDistDir/reporting-engines/appsensor-reporting-websocket/client
baseDir=../../src/reporting-engines/appsensor-reporting-websocket

srcServerDir=$baseDir/server
srcClientDir=$baseDir/client

rm -r $outRootDir

../../node_modules/.bin/tsc -d -p $baseDir/tsconfig.json > error.txt

sh check_error_file.sh error.txt
errLevel=$?
if [ $errLevel == 1 ]
then 
    exit 1
fi

cp $srcServerDir/*.json $outServerDir
cp $srcClientDir/*.json $outClientDir

cp $baseDir/package.json $outRootDir
cp $baseDir/Readme.md $outRootDir

#update for testing all of dependents
nodeModulesAppsensorlike=./node_modules/@appsensorlike/appsensorlike_reporting_engines_websocket

appsensorlikeUIWeb=../../src/appsensor-ui/web
rm -r $appsensorlikeUIWeb/$nodeModulesAppsensorlike
cp -r $outRootDir $appsensorlikeUIWeb/$nodeModulesAppsensorlike

appsensorlikeUIConsole=../../src/appsensor-ui/console
rm -r $appsensorlikeUIConsole/$nodeModulesAppsensorlike
cp -r $outRootDir $appsensorlikeUIConsole/$nodeModulesAppsensorlike