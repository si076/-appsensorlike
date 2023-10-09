set outRootDir=..\..\..\dist\@appsensorlike\appsensorlike_geolocators_fast_geoip
set baseDir=..\..\..\src\geolocators\fast-geoip

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json


copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%