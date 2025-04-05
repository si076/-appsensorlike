echo -- Build UI --


outRootDir=../../dist/@appsensorlike/appsensorlike_ui
outDistDir=$outRootDir/dist
outMySQLDir=$outDistDir/appsensor-ui/security/mysql
outSQLDir=$outMySQLDir/sql
baseDir=../../src/appsensor-ui

srcMySQLDir=$baseDir/security/mysql
srcSQLDir=$srcMySQLDir/sql

rm -r $outRootDir

../../node_modules/.bin/tsc -d -p $baseDir/tsconfig.json > error.txt

sh check_error_file.sh error.txt
errLevel=$?
if [ $errLevel == 1 ]
then 
    exit 1
fi

cp $srcMySQLDir/*.json $outMySQLDir

mkdir $outSQLDir
cp $srcSQLDir/tables.sql $outSQLDir

cp $baseDir/package.json $outRootDir
cp $baseDir/Readme.md $outRootDir

#update for testing all of dependents
nodeModulesAppsensorlike=./node_modules/@appsensorlike/appsensorlike_ui

appsensorlikeUIWeb=../../src/appsensor-ui/web
rm -r $appsensorlikeUIWeb/$nodeModulesAppsensorlike
cp -r $outRootDir $appsensorlikeUIWeb/$nodeModulesAppsensorlike

appsensorlikeUIConsole=../../src/appsensor-ui/console
rm -r $appsensorlikeUIConsole/$nodeModulesAppsensorlike
cp -r $outRootDir $appsensorlikeUIConsole/$nodeModulesAppsensorlike