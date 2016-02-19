var addr = {};

addr.prepend = function (a, resource, instance) {
	var _a = a;
	var _instance = '';

	if (!_a)
		_a = '';

	if (instance)
		_instance = ':' + instance;

	return resource + _instance + '.' + _a;
};

addr.append = function (a, resource, instance) {
	var _a = a;
	var _instance = '';

	if (!_a)
		_a = '';

	if (instance)
		_instance = ':' + instance;

	return _a + '.' + resource + _instance;
};

addr.inspect_top = function (a) {
	if (!a)
		return null;

	var _a = a.split('.');
	var _o = _a[0].split(':');
	var _r = _o[0];
	var _i = _o[1];

	return {
		resource : _r,
		instance : _i
	};
};

addr.pop = function (a) {
	if (!a)
		return null;

	var _a = a.split('.');

	_a.splice(0, 1);
	return _a.join('.');
};

addr.user = function (a) {
	if (!a)
		return null;

	var _a = a.split('.');
	var user = _a.splice(0, 1)[0].split(':');
	if (user[0] !== 'user')
		return null;

	return user[1];
};

module.exports = addr;
