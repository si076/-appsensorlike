outRootDir=../../dist/@appsensorlike/appsensorlike_ui

wd=$(pwd)

cd $outRootDir

npm publish --access public

cd $wd