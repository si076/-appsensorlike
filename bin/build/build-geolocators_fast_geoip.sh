echo -- Build Geolocators Fast Geoip --


outRootDir=../../dist/@appsensorlike/appsensorlike_geolocators_fast_geoip
baseDir=../../src/geolocators/fast-geoip

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