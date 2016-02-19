var events   = require('events');
var mongodb  = require('mongodb');
var mongoose = require('mongoose');
var config   = require('common/config');
var log      = require('provisioning/common/log').child({ module : 'mongoose' });

/*
 * Initialize and connnect */
var connection = mongoose.createConnection (config.prov.mongo);

var state = 'not-open';
var emitter = new events.EventEmitter();

connection.on('error', function (err) {
	log.error ({ error : err }, 'Connection error');
});

connection.on('disconnected', function () {
	log.warn ('disconnected');
});

connection.on('connected', function () {
	log.info ('connected');
});

connection.once('open', function (callback) {
	state = 'connected';
	log.info ({ db : config.api.mongo }, 'connection OK');
	emitter.emit('db-connected');
});

var db = {};
db.conn = connection;
db.emitter  = emitter;
db.mongoose  = mongoose;

module.exports = db;
