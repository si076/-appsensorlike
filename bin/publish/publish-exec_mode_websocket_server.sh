outRootDir=../../dist/@appsensorlike/appsensorlike_exec_mode_websocket_server

wd=$(pwd)

cd $outRootDir

npm publish --access public

cd $wd