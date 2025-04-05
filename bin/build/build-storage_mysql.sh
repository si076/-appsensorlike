echo -- Build Storage MySQL --


outRootDir=../../dist/@appsensorlike/appsensorlike_storage_mysql
outDistDir=$outRootDir/dist
outStorageMySQLDir=$outDistDir/storage-providers/appsensor-storage-mysql
baseDir=../../src/storage-providers/appsensor-storage-mysql

rm -r $outRootDir

../../node_modules/.bin/tsc -d -p $baseDir/tsconfig.json > error.txt

sh check_error_file.sh error.txt
errLevel=$?
if [ $errLevel == 1 ]
then 
    exit 1
fi

rm $outStorageMySQLDir/tests/*.d.ts
#rm following one by one because we want to keep appsensor-storage-mysql.d.ts
rm $outStorageMySQLDir/connection_manager.d.ts
rm $outStorageMySQLDir/DOP.d.ts
rm $outStorageMySQLDir/mapping.d.ts
rm $outStorageMySQLDir/utils.d.ts

mkdir $outStorageMySQLDir/sql
cp $baseDir/sql/* $outStorageMySQLDir/sql

cp $baseDir/appsensor-storage-mysql-config_schema.json $outStorageMySQLDir
cp $baseDir/appsensor-storage-mysql-config.json $outStorageMySQLDir
cp $baseDir/mapping_schema.json $outStorageMySQLDir
cp $baseDir/mapping.json $outStorageMySQLDir

cp $baseDir/package.json $outRootDir
cp $baseDir/Readme.md $outRootDir