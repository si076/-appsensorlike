echo -- Build All --


errorFile=error.txt
rm $errorFile

#ordered according to dependencies
sh build-core.sh
if [ $? = 1 ]
then
    echo Error on building core!
    exit 1
fi


sh build-storage_mysql.sh
if [ $? = 1 ] 
then
    echo Error on building storage mysql!
    exit 1 
fi

sh build-exec_mode_rest_client_node.sh
if [ $? = 1 ]
then
    echo Error on building rest client node!
    exit 1 
fi

sh build-geolocators_fast_geoip.sh
if [ $? = 1 ]
then
    echo Error on building geolocators with fast_geoip!
    exit 1 
fi


sh build-rest_server.sh
if [ $? = 1 ]
then
    echo Error on building rest server! 
    exit 1 
fi

sh build-exec_mode_rest_server.sh
if [ $? = 1 ]
then
    echo Error on building exec mode rest server! 
    exit 1 
fi


sh build-websocket.sh
if [ $? = 1 ]
then
    echo Error on building websocket! 
    exit 1 
fi

sh build-reporting_engines_websocket.sh
if [ $? = 1 ]
then
    echo Error on building reporting engines websocket! 
    exit 1 
fi

sh build-exec_mode_websocket_client_node.sh
if [ $? = 1 ]
then
    echo Error on building exec mode websocket client node! 
    exit 1 
fi

sh build-exec_mode_websocket_server.sh
if [ $? = 1 ]
then
    echo Error on building exec mode websocket server! 
    exit 1 
fi


sh build-ui.sh
if [ $? = 1 ]
then
    echo Error on building ui! 
    exit 1 
fi

sh build-ui_console.sh
if [ $? = 1 ]
then
    echo Error on building ui console! 
    exit 1 
fi

sh build-ui_web.sh
if [ $? = 1 ]
then
    echo Error on building ui web! 
    exit 1 
fi