controller = {};

/* show login page */
controller.show = function (req, res, next) {
	res.render('login.mat-design.jade', { user: req.user });
};

module.exports = controller;
