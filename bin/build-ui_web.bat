set outRootDir=..\dist\@appsensorlike\appsensorlike_ui_web
set outDistDir=%outRootDir%\dist
set outWebDir=%outDistDir%\appsensor-ui\web
set outTemplatesDir=%outWebDir%\templates
set outStaticDir=%outWebDir%\static
set baseDir=..\src\appsensor-ui\web


set srcTemplatesDir=%baseDir%\templates
set srcStaticDir=%baseDir%\static

rd %outRootDir% /s /q

call tsc -d -p %baseDir%\tsconfig.json

copy %baseDir%\appsensor-ui-rest-server-config.json %outWebDir%
copy %baseDir%\appsensor-rest-server-config_schema.json %outWebDir%

mkdir %outTemplatesDir%
xcopy %srcTemplatesDir% %outTemplatesDir% /E

mkdir %outStaticDir%
xcopy %srcStaticDir% %outStaticDir% /E


copy %baseDir%\package.json %outRootDir%
copy %baseDir%\Readme.md %outRootDir%

