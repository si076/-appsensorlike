

moduleDir=../../src/storage-providers/appsensor-storage-mysql

outDistDir=./dist
outStorageMySQLDir=$outDistDir/storage-providers/appsensor-storage-mysql
outTestsDir=$outStorageMySQLDir/tests

srcTestsDir=./tests

sd=$(pwd)

cd $moduleDir

md=$(pwd)

echo ---
echo "Compiling .ts files..."
$sd/../../node_modules/.bin/tsc -p tsconfig-tests.json

echo ---
echo "Copying config files..."
cp $srcTestsDir/appsensor-storage-mysql-config_schema.json $outStorageMySQLDir
cp $srcTestsDir/appsensor-storage-mysql-config.json $outStorageMySQLDir
cp ./mapping_schema.json $outStorageMySQLDir
cp ./mapping.json $outStorageMySQLDir

echo ---
echo "Running tests..."
cd $outStorageMySQLDir
npx run-func $srcTestsDir/tests.js runTestsExecModeLocal a
errLevel=$?

echo ---
echo Copying log files
logsDir=$sd/logs/storage_mysql 
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