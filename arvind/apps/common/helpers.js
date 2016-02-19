var helpers = {};

helpers.is_numeric = function (n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
};

module.exports = helpers;
