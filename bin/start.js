/**
 * Created by Bamba on 09/10/2015.
 */

var EventEmitter = require('events').EventEmitter;
var arduinoServer = require('./arduinoserver.js').createArduinoServer(false);

var clock = new EventEmitter();
var counter = 0;

var serialServer = require('./serial/serialserver.js').start(arduinoServer, clock);
var httpServer = require('./control panel/server.js').start(arduinoServer, clock);

arduinoServer.emit('start');
