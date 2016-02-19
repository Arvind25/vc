cipher = {};

cipher.decode = function (log_, type, msg) {
	var log  = log_.child ({ module : 'cipher' });

	/* For now the mesage is just URL encoded */
	var deciphered = decodeURIComponent (msg);
	log.info ({ cipher : msg, deciphered : deciphered }, 'decode');

	return deciphered;
};

module.exports = cipher;
