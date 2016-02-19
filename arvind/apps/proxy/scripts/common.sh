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

#
# Parse optional arguments
#
function parse_optional_args {

	while [ $# -gt 0 ];
	do
		[ "$1" == "-h" ] && { export HOST=$2; shift;shift; }
		[ "$1" == "-p" ] && { export USERPASSWORD=$2; shift;shift; }
		shift
	done;
}

#
# Calculate canonical path for this script's directory
#
export CANONICAL_PATH=`pwd`/`dirname $0`
export ROOT=$CANONICAL_PATH/$RELATIVE_ROOT
export BIN=$ROOT/scripts/bin
export JQ=$BIN/jq-linux64
