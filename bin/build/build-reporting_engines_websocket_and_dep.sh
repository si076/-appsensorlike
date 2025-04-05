echo -- Build Reporting Engines Websocket And Dependencies --


errorFile=error.txt
rm $errorFile

sh build-reporting_engines_websocket.sh
if [ $? = 1 ]
then
    echo Error on building reporting engines websocket! 
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