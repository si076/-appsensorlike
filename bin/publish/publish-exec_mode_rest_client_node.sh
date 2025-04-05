outRootDir=../../dist/@appsensorlike/appsensorlike_exec_mode_rest_client_node

wd=$(pwd)

cd $outRootDir

npm publish --access public

cd $wd