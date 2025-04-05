

moduleDir=../../src/geolocators/fast-geoip

outDistDir=./dist
outFastGeoipDir=$outDistDir/geolocators/fast-geoip

srcTestsDir=./tests

sd=$(pwd)

cd $moduleDir

md=$(pwd)

echo ---
echo "Compiling .ts files..."
$sd/../../node_modules/.bin/tsc -p tsconfig-tests.json

echo ---
echo "Running tests..."
cd $outFastGeoipDir
npx run-func $srcTestsDir/tests.js runTests
errLevel=$?

echo ---
echo Copying log files
logsDir=$sd/logs/geolocators_fast_geoip 
rm -r $logsDir
mkdir $logsDir
cp *.log $logsDir

cd $md

echo ---
echo Clearing tests dir
rm -r $outDistDir

cd $sd

if [ $errLevel = 1 ] 
then
    exit 1
fi