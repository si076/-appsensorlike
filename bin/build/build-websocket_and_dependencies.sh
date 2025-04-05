echo -- Build Websocket And Dependencies --


errorFile=error.txt
rm $errorFile

sh build-websocket.sh
if [ $? = 1 ]
echo Error on building websocket! 
exit 1 
fi

sh build-reporting_engines_websocket.sh
if [ $? = 1 ]
echo Error on building reporting engines websocket! 
exit 1 
fi

sh build-exec_mode_websocket_client_node.sh
if [ $? = 1 ]
echo Error on building exec mode websocket client node! 
exit 1 
fi

sh build-exec_mode_websocket_server.sh
if [ $? = 1 ]
then
    echo Error on building exec mode websocket server! 
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