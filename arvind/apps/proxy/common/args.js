var minimist = require ('minimist');
var log      = require ('./log');

var _argv = minimist(process.argv.slice(2));

var args = {};

args.host = get_host();

args.logs = get_logs();

function get_host () {
	var val = _argv.host;
	if (!val){
		val = process.env.HOST;
		if (!val){
			console.log ('Usage: node app.js --host <hostname> or set env HOST');
			console.log ('optional : \n--logs <true/false>');
			process.exit(1);
		}
	}
	return val;
}

function get_logs () {
	var val = _argv.logs;
	if (!val){
		val = process.env.LOGS ? process.env.LOGS : true;
	}
	else{
		val = (val == "false") ? false : true;
	}
	return val;
}

module.exports = args;
