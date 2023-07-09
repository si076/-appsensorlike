set outRootDir=..\..\..\dist\@appsensorlike\appsensorlike_rest_server
set outDistDir=%outRootDir%\dist

rd %outRootDir% /s /q

call tsc -d

copy package.json %outRootDir%
copy Readme.md %outRootDir%