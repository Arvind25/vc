var log 	= require('./log');
var host 	= process.argv[2];

if (!host) {

	/* Fall back on env if nothing is specified on the command line */
	host = process.env.PROXY_HOST_NAME;

	if (!host) {
		console.log ('Usage: node proxy-chat.js <hostname> or set env PROXY_HOST_NAME');
		process.exit (1);
	}
}

module.exports = host;

