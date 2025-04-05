echo -- Build UI Console --


outRootDir=../../dist/@appsensorlike/appsensorlike_ui_console
outDistDir=$outRootDir/dist
outConsoleDir=$outDistDir/appsensor-ui/console
baseDir=../../src/appsensor-ui/console

rm -r $outRootDir

../../node_modules/.bin/tsc -p $baseDir/tsconfig.json > error.txt

sh check_error_file.sh error.txt
errLevel=$?
if [ $errLevel == 1 ]
then 
    exit 1
fi

cp $baseDir/appsensor-console-ui-settings.json $outConsoleDir
cp $baseDir/appsensor-detection-point-descriptions.json $outConsoleDir
cp $baseDir/appsensor-responses-descriptions.json $outConsoleDir


cp $baseDir/package.json $outRootDir
cp $baseDir/Readme.md $outRootDir