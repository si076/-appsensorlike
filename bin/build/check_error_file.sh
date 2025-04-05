#!/bin/bash

file=$1

test -f $file
fileexists=$?

filesize=0
if [ $fileexists = 0 ]
then
    filesize=$(stat -c '%s' $file)
fi

echo $file $filesize $fileexists

if [[ $fileexists = 0 && $filesize > 0 ]] 
then
    exit 1
else
    exit 0
fi