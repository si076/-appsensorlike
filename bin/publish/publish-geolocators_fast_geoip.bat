set outRootDir=..\..\dist\@appsensorlike\appsensorlike_geolocators_fast_geoip

set wd=%CD%

cd %outRootDir%

call npm publish --access public

cd %wd%