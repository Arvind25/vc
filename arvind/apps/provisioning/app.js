var express         = require('express');
var path            = require('path');
var favicon         = require('serve-favicon');
var cookieParser    = require('cookie-parser');
var bodyParser      = require('body-parser');
var ex_sess         = require('express-session');

var args            = require('common/args');
var log             = require('provisioning/common/log');
var db              = require('provisioning/common/db');
var session         = require('provisioning/routes/session');
var proxy           = require('common/proxy');

var sess = { cookie:
				{ },
				secret: '&^%Gbu45t;#tLa*',
				saveUninitialized: false,
				resave: true,
			};

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
if (app.get('env') === 'production') {
		app.set('trust proxy', true);
		sess.cookie.secure = true;
}

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(ex_sess(sess));

app.use(log.req_logger);
app.use('/session', session);

app.use(function(req, res, next) {
			var err = new Error('Not Found');
			err.status = 404;
			next(err);
			});

app.use(log.err_logger);
proxy.add_route ('/provisioning', 'http://localhost:2178/provisioning');

/*
 * Error handlers
 * --------------------
 * Development error handler - will print stacktrace
 */
if (app.get('env') === 'development') {
		app.use(function(err, req, res, next) {
						res.status(err.status || 500);
						res.render('error', {
								message: err.message,
								error: err
								});
						});
}
else {
	/*
	 * Production error handler - no stacktraces leaked to user
	 */
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: {}
		});
	});
}

module.exports = app;
