controller = {};

/* show page to add credentials to mongodb */
controller.add = function (req, res, next) {
    res.render('config_add.jade', { user: req.user });
};

/* show page to remove credentials from mongodb */
controller.remove = function (req, res, next) {
    res.render('config_remove.jade', { user: req.user });
};

module.exports = controller;
