controller = {};

/* show page for wiziq authentication.
 * this code has to be thought about yet
 */ 
controller.show = function (req, res, next) {
	res.render('wiziq_auth.jade', { user: req.user });
};

module.exports = controller;

