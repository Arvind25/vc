var browser = {};

browser.check_compatibility = function (req, res, next) {

	/*
	 * If the browser check is not done, then redirect to the browser
	 * check page, else pass through */
	var check = req.cookies.wiziq_bc;

	if (!check) {
		/*
		 * Return the browser check page instead. The JS on this page
		 * will reload the same URL if the browser is compatible. */
		req.log.info ({ module : 'browser-check', cookie : req.cookies }, 'redirecting to browser-check');
		return res.render('../views/browser-check');
	}

	next();
};

module.exports = browser;
