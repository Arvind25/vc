cipher = {};

cipher.decode = function (log, type, msg) {
	/* For now the mesage is just URL encoded */
	log.info ({ module: 'cipher', cipher : msg });
	return decodeURIComponent (msg);
};

module.exports = cipher;
