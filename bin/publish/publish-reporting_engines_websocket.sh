outRootDir=../../dist/@appsensorlike/appsensorlike_reporting_engines_websocket

wd=$(pwd)

cd $outRootDir

npm publish --access public

cd $wd