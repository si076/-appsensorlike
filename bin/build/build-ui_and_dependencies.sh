echo -- Build UI And Dependencies --

errorFile=error.txt
rm $errorFile

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