outRootDir=../../dist/@appsensorlike/appsensorlike_geolocators_fast_geoip

wd=$(pwd)

cd $outRootDir

npm publish --access public

cd $wd