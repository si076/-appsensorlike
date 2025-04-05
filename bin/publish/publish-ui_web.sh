outRootDir=../../dist/@appsensorlike/appsensorlike_ui_web

wd=$(pwd)

cd $outRootDir

npm publish --access public

cd $wd