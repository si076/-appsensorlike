outRootDir=../../dist/@appsensorlike/appsensorlike

wd=$(pwd)

cd $outRootDir

npm publish --access public

cd $wd