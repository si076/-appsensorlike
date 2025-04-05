

moduleDir=../../src/reporting-engines/appsensor-reporting-websocket

testDir=./tests
serverDir=./server
clientDir=./client

outDistDir=./dist
outReportingWebsocketDir=$outDistDir/reporting-engines/appsensor-reporting-websocket
outTestsDir=$outReportingWebsocketDir/tests


sd=$(pwd)

cd $moduleDir

md=$(pwd)

echo ---
echo "Compiling .ts files..."
$sd/../../node_modules/.bin/tsc -p tsconfig-tests.json

echo ---
echo "Copying config files..." 
cp $testDir/*.json $outTestsDir
cp $serverDir/*.json $outReportingWebsocketDir/$serverDir
cp $clientDir/*.json $outReportingWebsocketDir/$clientDir
cp $testDir/*.pem $outReportingWebsocketDir

echo ---
echo "Running tests..."
cd $outReportingWebsocketDir
npx run-func $testDir/appsensor-reporting-websocket-tests.js runTests
errLevel=$?

echo ---
echo Copying log files
logsDir=$sd/logs/reporting_websocket 
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