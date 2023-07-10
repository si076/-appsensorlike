set outRootDir=..\..\..\dist\@appsensorlike\appsensorlike_ui_web
set outDistDir=%outRootDir%\dist
set outWebDir=%outDistDir%\appsensor-ui\web
set outTemplatesDir=%outWebDir%\templates
set outStaticDir=%outWebDir%\static


set srcWebDir=..\..\..\src\appsensor-ui\web
set srcTemplatesDir=%srcWebDir%\templates
set srcStaticDir=%srcWebDir%\static

rd %outRootDir% /s /q

call tsc -d

copy %srcWebDir%\appsensor-ui-rest-server-config.json %outWebDir%
copy %srcWebDir%\appsensor-rest-server-config_schema.json %outWebDir%

mkdir %outTemplatesDir%
xcopy %srcTemplatesDir% %outTemplatesDir% /E

mkdir %outStaticDir%
xcopy %srcStaticDir% %outStaticDir% /E


copy package.json %outRootDir%
copy Readme.md %outRootDir%

