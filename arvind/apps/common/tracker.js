var _id = 1;
var tracker = function (req, res, next) {
	req.req_id = _id++;
	next ();
};

module.exports = tracker;
