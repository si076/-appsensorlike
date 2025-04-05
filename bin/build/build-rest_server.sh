echo -- Build Rest Server --


outRootDir=../../dist/@appsensorlike/appsensorlike_rest_server
outDistDir=$outRootDir/dist
baseDir=../../src/rest/server

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
nodeModulesAppsensorlike=./node_modules/@appsensorlike/appsensorlike_rest_server

execModeRest=../../src/execution-modes/appsensor-rest
rm -r $execModeRest/$nodeModulesAppsensorlike
cp -r $outRootDir $execModeRest/$nodeModulesAppsensorlike

execModeRestServer=../../src/execution-modes/appsensor-rest/server
rm -r $execModeRestServer/$nodeModulesAppsensorlike
cp -r $outRootDir $execModeRestServer/$nodeModulesAppsensorlike

appsensorlikeUIWeb=../../src/appsensor-ui/web
rm -r $appsensorlikeUIWeb/$nodeModulesAppsensorlike
cp -r $outRootDir $appsensorlikeUIWeb/$nodeModulesAppsensorlike
