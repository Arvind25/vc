var winston = require('winston');

var log;
var levels = {
		'important' : 0,
		'fatal' : 1,
		'error' : 2,
		'warn'  : 3,
		'info'  : 4,
		'news'  : 5,
		'debug' : 6
};

var colors = {
		'important' : 'magenta',
		'fatal' : 'red',
		'error' : 'red',
		'warn'  : 'yellow',
		'info'  : 'green',
		'news'  : 'cyan',
		'debug' : 'white'
};

log = new (winston.Logger)({
				levels : levels,
		});
winston.addColors(colors);

if (process.env.NODE_ENV !== 'production') {
		
		/* Add console */
		log.add(winston.transports.Console, {
						level : 'debug',
						colorize : 'all',
						timestamp : true,
						humanReadableUnhandledException : true,
				});

}

if (process.env.NODE_ENV === 'production') {

		/* Add file rotater */
		log.add(winston.transports.DailyRotateFile, {
						level : 'info',
						colorize : false,
						timestamp : true,
						filename : 'logs/impact.log-',
						//maxsize : 51200, /* 50 KB */
						datePattern : 'yyyy-MM-dd',
						prettyPrint : true,
						maxFiles : 20,
						json : false,
						showLevel : true,
						tailable : true,
						maxRetries : 1,
						humanReadableUnhandledException : true,
				});
}

module.exports = log
