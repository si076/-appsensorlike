outRootDir=../../dist/@appsensorlike/appsensorlike_websocket

wd=$(pwd)

cd $outRootDir

npm publish --access public

cd $wd