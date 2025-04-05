echo -- Build Exec Mode Websocket Server --


outRootDir=../../dist/@appsensorlike/appsensorlike_exec_mode_websocket_server
outDistDir=$outRootDir/dist
outHandlerDir=$outDistDir/execution-modes/appsensor-websocket/server/handler
baseDir=../../src/execution-modes/appsensor-websocket/server

srcHandlerDir=$baseDir/handler

rm -r $outRootDir

../../node_modules/.bin/tsc -d -p $baseDir/tsconfig.json > error.txt

sh check_error_file.sh error.txt
errLevel=$?
if [ $errLevel == 1 ]
then 
    exit 1
fi

rm $outHandlerDir/*.d.ts

cp $srcHandlerDir/*.json $outHandlerDir

cp $baseDir/package.json $outRootDir
cp $baseDir/Readme.md $outRootDir