@echo off

set errorFile=error.txt
del %errorFile%

call test-core.bat
if %errorlevel%==1 (
    echo Error on test core! > error.txt 
    exit /b 1
)

call test-exec_mode_rest.bat
if %errorlevel%==1 (
    echo Error on test exec_mode_rest! > error.txt
    exit /b 1
)

call test-exec_mode_websocket.bat
if %errorlevel%==1 (
    echo Error on test exec_mode_websocket! > error.txt
    exit /b 1
)

call test-reporting_engines_websocket.bat
if %errorlevel%==1 (
    echo Error on test reporting_engines_websocket! > error.txt
    exit /b 1
)

call test-storage_mysql.bat
if %errorlevel%==1 (
    echo Error on test storage_mysql! > error.txt
    exit /b 1
)

call test-geolocators_fast_geoip.bat
if %errorlevel%==1 (
    echo Error on test geolocators_fast_geoip! > error.txt
    exit /b 1
)
