echo -- Build Rest Server And Dependencies --


errorFile=error.txt
rm $errorFile


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

sh build-ui_web.sh
if [ $? = 1 ]
then
    echo Error on building ui web! 
    exit 1 
fi