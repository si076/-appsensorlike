echo -- Build UI Web --


outRootDir=../../dist/@appsensorlike/appsensorlike_ui_web
outDistDir=$outRootDir/dist
outWebDir=$outDistDir/appsensor-ui/web
outTemplatesDir=$outWebDir/templates
outStaticDir=$outWebDir/static
baseDir=../../src/appsensor-ui/web


srcTemplatesDir=$baseDir/templates
srcStaticDir=$baseDir/static

rm -r $outRootDir

../../node_modules/.bin/tsc -d -p $baseDir/tsconfig.json > error.txt

sh check_error_file.sh error.txt
errLevel=$?
if [ $errLevel == 1 ]
then 
    exit 1
fi

cp $baseDir/appsensor-ui-rest-server-config.json $outWebDir
cp $baseDir/appsensor-rest-server-config_schema.json $outWebDir

mkdir $outTemplatesDir
cp -r $srcTemplatesDir $outTemplatesDir

mkdir $outStaticDir
cp -r $srcStaticDir $outStaticDir


cp $baseDir/package.json $outRootDir
cp $baseDir/Readme.md $outRootDir

