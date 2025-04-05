

moduleDir=../../src/execution-modes/appsensor-websocket

outDistDir=./dist
outRestDir=$outDistDir/execution-modes/appsensor-websocket
outTestsDir=$outStorageMySQLDir/tests

testsDir=./tests
handlerDir=./server/handler
eventDir=./client-node/event

configFile=../tests/analysis/appsensor-analysis-tests-server-config.json

sd=$(pwd)

cd $moduleDir

md=$(pwd)

echo ---
echo "Compiling .ts files..."
$sd/../../node_modules/.bin/tsc -p tsconfig-tests.json

echo ---
echo "Copying config files..."
cp $configFile $outRestDir
cp $handlerDir/*.json $outRestDir/$handlerDir
cp $eventDir/*.json $outRestDir/$eventDir

echo ---
echo "Running tests..."
cd $outRestDir
npx run-func $testsDir/tests.js runTests
errLevel=$?

echo ---
echo Copying log files
logsDir=$sd/logs/exec_mode_websocket 
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