/**
 * Created by Bamba on 26/09/2015.
 */


var EventEmitter = require('events').EventEmitter;
var ArdSer = require('./arduinoserver.js');

var arduinoServer = ArdSer.createArduinoServer(false);


arduinoServer.on('control', function(data){
    console.log('control sensor:  ' + data.sensor);
});


arduinoServer.on('setActuator', function(data){
    console.log('actuator :   ' + data.id);
    console.log('value:   '+ data.value);
});


arduinoServer.emit('start');
arduinoServer.emit('sense', {id : 2, value : 943, pin : 2});


