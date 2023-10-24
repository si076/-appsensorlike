@echo -- Build Geolocators Fast Geoip --
@echo off

set outRootDir=..\..\dist\@appsensorlike\appsensorlike_geolocators_fast_geoip
set baseDir=..\..\src\geolocators\fast-geoip

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json > error.txt

call check_error_file.bat error.txt
if %errorlevel%==1 (
    exit /b 1
)

copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%