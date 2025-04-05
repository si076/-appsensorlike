outRootDir=../../dist/@appsensorlike/appsensorlike_storage_mysql

wd=$(pwd)

cd $outRootDir

npm publish --access public

cd $wd