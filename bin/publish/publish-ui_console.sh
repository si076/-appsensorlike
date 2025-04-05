outRootDir=../../dist/@appsensorlike/appsensorlike_ui_console

wd=$(pwd)

cd $outRootDir

npm publish --access public

cd $wd