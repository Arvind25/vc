var proxy = new require('redbird') ({
	port : 80,
	ssl  : {
		port    : 443,
		key     : 'certificates/dev-key.pem',
		cert    : 'certificates/dev-cert.pem',
	}
});

module.exports = proxy;
