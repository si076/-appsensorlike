echo -- Build Exec Mode Websocket Client Node --


outRootDir=../../dist/@appsensorlike/appsensorlike_exec_mode_websocket_client_node
outDistDir=$outRootDir/dist
outEventDir=$outDistDir/execution-modes/appsensor-websocket/client-node/event
baseDir=../../src/execution-modes/appsensor-websocket/client-node

srcEventDir=$baseDir/event

rm -r $outRootDir

../../node_modules/.bin/tsc -d -p $baseDir/tsconfig.json > error.txt

sh check_error_file.sh error.txt
errLevel=$?
if [ $errLevel == 1 ]
then 
    exit 1
fi

rm $outEventDir/*.d.ts

cp $srcEventDir/*.json $outEventDir

cp $baseDir/package.json $outRootDir
cp $baseDir/Readme.md $outRootDir