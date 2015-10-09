
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
                            id : findIdFromCom(jsonSensors, {
                                pin : parseInt(string.substr(5,2)),
                                COM : port.name
                            }),
                            value : parseInt(string.substr(8, 3))
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

function onSetActuator(data) {
    console.log(data );
    jsonActuators.some(function (element) {

        if (element.id == data.id) {
            serials.some(function (el) {
                if (el.name == element.COM) {
                    var string = '@saa:';
                    string += element.pin < 10 ? '0' + element.pin : element.pin;
                    if (data.value < 10) {
                        string += ':00' + data.value + '#';
                    }
                    else if (data.value < 100) {
                        string += ':0' + data.value + '#';
                    }
                    else {
                        string += ':' + data.value + '#';
                    }
                    if (el.port.isOpen()) {
                        el.port.write(string);
                        console.log(string);
                    }
                    else {
                        culo.on('setupArduino' + el.name, function () {
                            setTimeout(function () {
                                el.port.write(string);
                            }, 2000);
                        });
                    }
                    return true;
                }
            });
            return true;
        }
    });
}


function onControl(data){
    jsonSensors.some(function(element){
            if(element.id == data.sensor){
                serials.some(function(el){
                    if(el.name == element.COM){
                        if (el.port.isOpen()){
                            el.port.write('@lum:' + (element.pin < 10 ? '0' + element.pin : element.pin) + '#'); // todo: cambiare
                            el.port.write('@ttr:' + (element.pin < 10 ? '0' + element.pin : element.pin) + ':01#');
                        }
                        else{
                            console.log('culo2');
                            culo.on('setupArduino' + el.name, function(){
                                setTimeout(function(){var string = '@lum:' + (element.pin < 10 ? '0' + element.pin : element.pin) + '#' +'@ttr:' + (element.pin < 10 ? '0' + element.pin : element.pin) + ':01#'; //todo : cambiare
                                    //console.log('culo3' + el.name);
                                    console.log('setting at:' + string);
                                    el.port.write(string);
                                }, 2000);
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
    jsonSensors.some(function(element){
        if(element.id == data.sensor){
            serials.some(function(el){
                if(el.name == element.COM){
                    el.port.write('@stp:' + (element.pin < 10 ?  '0' + element.pin : element.pin) +'#' );
                    return true;
                }
            });
            return true
        }
    });
}

//todo: togliere completamente la funzione
/*
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
*/

function findIdFromCom(jsonVector, data){
    var result = '';
    jsonVector.some(function (element) {
        if(element.COM == data.COM && element.pin == data.pin){
            result = element.id;
            return true
        }
    });
    return result;
}
