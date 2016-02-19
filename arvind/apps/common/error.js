var err = {};

err.internal = function err (message) {
	var e = {};
    e.status = 500;
    e.message = message;
    e.stack = (new Error()).stack;
	return e;
};

err.bad_request = function err (message) {
	var e = {};
    e.status = 400;
    e.message = message;
    e.stack = (new Error()).stack;
	return e;
};

err.auth_required = function err (message) {
	var e = {};
    e.status = 401;
    e.message = message;
    e.stack = (new Error()).stack;
	return e;
};

err.forbidden = function err (message) {
	var e = {};
    e.status = 403;
    e.message = message;
    e.stack = (new Error()).stack;
	return e;
};

err.not_found = function err (message) {
	var e = {};
    e.status = 404;
    e.message = message;
    e.stack = (new Error()).stack;
	return e;
};

module.exports = err;
