outRootDir=../../dist/@appsensorlike/appsensorlike_exec_mode_rest_server

wd=$(pwd)

cd $outRootDir

npm publish --access public

cd $wd