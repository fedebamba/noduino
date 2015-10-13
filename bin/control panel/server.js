

var http = require('http');
var io = require('socket.io');
var fs = require('fs');
//var arduinoServer = require('../arduinoserver.js').createArduinoServer(false);


module.exports.start = function(arduinoServer, finisher){
    console.log( 'initializing http socket...' );
    var server = http.createServer(function(req, res){
        var html =fs.readFileSync(__dirname + '/index.html');
        res.writeHeader(200, {"Content-Type": "text/html"});
        res.write(html);
        res.end();
    });
    server.listen(3000, function(){
        console.log('culo');
    });
    var soc = io.listen(server);

    //retrieving json data
    var jsonSensors = JSON.parse(fs.readFileSync(__dirname + '/../jsons/sensors.json'));

    //events
    soc.on('connection', function(socket){
        console.log('connection');
        arduinoServer.on('control', function(data){
            console.log(data.sensor);

            var sensordata = {};
            jsonSensors.some(function(element){
                if(element.id == data.sensor){
                    sensordata.id = element.id;
                    sensordata.tag = element.tag;
                    sensordata.com = element.COM;
                    sensordata.pin = element.pin;
                }
            });
            socket.emit('setup', sensordata);
        });

        arduinoServer.on('setActuator', function(data){
            console.log('setting actuator ' + data.id + 'at' + data.value);
            socket.emit('setActuator', data);
        });

        arduinoServer.on('getActuator', function(data){
            socket.emit('getActuator', data);
        });

        socket.on('measure', function(data){
            console.log( 'measured:  ' + data.value + 'at sensor :' + data.id);
            arduinoServer.emit('sense',data);
        });

        socket.on('start', function (){
            console.log('started');
        });
        socket.emit('connected');
        arduinoServer.emit('setup');
    });
    console.log('http sockets initialized');
};





