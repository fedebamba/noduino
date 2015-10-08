
var fs = require('fs');
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var EventEmitter = require('events').EventEmitter;


var arduinoServer = require('../arduinoserver.js').createArduinoServer(false);
var culo = new EventEmitter();


//retrieving json data
var jsonSensors = JSON.parse(fs.readFileSync(__dirname + '/../jsons/sensors.json'));
var jsonActuators = JSON.parse(fs.readFileSync(__dirname + '/../jsons/actuators.json'));

//init serial ports
var comSet = [];
jsonSensors.forEach(function(element){
    if(!(comSet.indexOf(element.COM) > -1)){
        comSet[comSet.length] = element.COM;
    }
});
jsonActuators.forEach(function(element){
    if(!(comSet.indexOf(element.COM) > -1)){
        comSet[comSet.length] = element.COM;
    }
});

var serials = [];

console.log(comSet);

for (var i  = 0; i < comSet.length; i++){
    serials[i] = {name : comSet[i], port : new SerialPort(comSet[i], {
        baudrate : 9600,
        parser : serialport.parsers.readline('#')
    }, false)};
}

serials.forEach(function(port) {
    port.port.open(function (error) {
        if (error) {
            console.log('failed to open,  ' + error);
        }
        else {
            console.log('opening port : ' + port.name);
            port.port.on('data', function (chunk) {
                var string = chunk.substring(chunk.indexOf('@'));
                console.log(string);
                var command = string.substr(1, 3);
                console.log(command);
                switch (command) {
                    case 'get': //sense case
                        arduinoServer.emit('sense',{
                            id : findCom(jsonSensors, {
                                pin : parseInt(string.substr(5,2)),
                                COM : this.port.comName
                            }),
                            value : parseInt(string.substr(7, 3))
                        });
                        break;
                    case 'ack':
                        console.log('ack vaffanculo');
                        break;
                }
                });
            culo.emit('setupArduino' + port.name);
        }
        console.log('t');
    });
});

arduinoServer.on('control', onControl);
arduinoServer.on('setActuator', onSetActuator);

arduinoServer.emit('start');

function onSetActuator(data){
    findPort(jsonActuators, data, function(chunk){
        return '@set:' + chunk.pin.toString() + chunk.data.value.toString() + '#';
    });
}

function onControl(data){
    jsonSensors.some(function(element){
            if(element.id == data.sensor){
                serials.some(function(el){
                    if(el.name == element.COM){
                        if (el.port.isOpen()){
                            el.port.write('@sen:' + (element.pin < 10 ? '0' + element.pin : element.pin) + '#');
                        }
                        else{
                            console.log('culo2');
                            culo.on('setupArduino' + el.name, function(){
                                setTimeout(function(){var string = '@sen:' + (element.pin < 10 ? '0' + element.pin : element.pin) + '#';
                                    //console.log('culo3' + el.name);
                                    console.log('setting at:' + string);
                                    el.port.write(string);}, 2000);
                            });
                        }

                        return true;
                    }
                });
                return true
            }
    });
}

//todo: rifare
function onStopControl(data){
    findPort(jsonSensors, data, function(chunk){
        return '@stp:' + chunk.pin.toString() + '#';
    });
}

//todo: add this in arduino protocol
function onGetSensor(data){
    findPort(jsonSensors, data, function(chunk){
        return '@g' + chunk.pin.toString() + '#';
    });
}

//todo: togliere completamente la funzione
function findPort(jsonVector, data, callback){
    jsonVector.some(function(element){
        if(element.id == data.id){
            serials.some(function(el){
                if(el.name == element.COM){
                    el.port.write(callback({data : data, pin : element.pin}));
                    return true;
                }
            });
            return true
        }
    });

}

function findCom(jsonVector, data){
    var result = '';
    jsonVector.some(function (element) {
        if(element.COM == data.COM && element.pin == data.pin){
            result = element.id;
            return true
        }
    });
    return result;
}






























/*
*
*
*
*
* */