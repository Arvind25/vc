#!/bin/bash

arch=`uname`;
[ "$arch" == 'Darwin' ] && { export JQ='./bin/jq'; }
[ "$arch" == 'Linux' ] && { export JQ='./bin/jq-linux64'; }

#
# Arguments :
#	1. filen name with JSON response + HTTP code
#
function print_json {

	FILE=$1;

	CODE=`grep HTTP-CODE $FILE | sed 's@^.*HTTP-CODE:@@g'`
	[ "$CODE" == '200' ] && { 
		cat $FILE | grep -v HTTP-CODE | $JQ;
		echo ' - HTTP-CODE:200'
	}
	[ "$CODE" != '200' ] && { 
		cat $FILE;
	}
}

