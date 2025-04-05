

errorFile=error.txt
rm $errorFile

sh test-core.sh
if [ $? = 1 ]
then
    echo Error on test core! > error.txt 
    exit 1
fi

sh test-exec_mode_rest.sh
if [ $? = 1 ]
then
    echo Error on test exec_mode_rest! > error.txt
    exit 1
fi

sh test-exec_mode_websocket.sh
if [ $? = 1 ]
then
    echo Error on test exec_mode_websocket! > error.txt
    exit 1
fi

sh test-reporting_engines_websocket.sh
if [ $? = 1 ]
then
    echo Error on test reporting_engines_websocket! > error.txt
    exit 1
fi

sh test-storage_mysql.sh
if [ $? = 1 ]
then
    echo Error on test storage_mysql! > error.txt
    exit 1
fi

sh test-geolocators_fast_geoip.sh
if [ $? = 1 ]
then
    echo Error on test geolocators_fast_geoip! > error.txt
    exit 1
fi
