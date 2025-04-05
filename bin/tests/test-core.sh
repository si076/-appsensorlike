

moduleDir=../..

distDir=./dist
srcDir=./src


configServerDir=./configuration-modes/appsensor-configuration-json/server
configClientDir=./configuration-modes/appsensor-configuration-json/client
testsDir=./tests

outDistDir=$distDir/core/tests
outLoggingDir=$outDistDir/logging

srcLoggingDir=$srcDir/logging

sd=$(pwd)

cd $moduleDir

md=$(pwd)

echo ---
echo "Compiling .ts files..."
$sd/../../node_modules/.bin/tsc -p tsconfig-tests.json

echo ---
echo Copying config files
cp $srcLoggingDir/*.json $outLoggingDir
cp $srcDir/$configServerDir/*.json $outDistDir/$configServerDir 
cp $srcDir/$configClientDir/*.json $outDistDir/$configClientDir
cp $srcDir/$configServerDir/$testsDir/*.json $outDistDir/$configServerDir/$testsDir 
cp $srcDir/$configClientDir/$testsDir/*.json $outDistDir/$configClientDir/$testsDir

echo ---
echo "Running tests..."
cd $outDistDir
npx run-func $testsDir/tests.js runTests a
errLevel=$?

echo ---
echo Copying log files
logsDir=$sd/logs/core
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