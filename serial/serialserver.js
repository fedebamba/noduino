
    //as far as i am concerned:
    //@h means set actuator at value;
    //@g means get actuator
    //@s means watch pin for changes
    //@t means cease to watch pin




var fs = require('fs');
var SerialPort = require('serialport').SerialPort;

var arduinoServer = require('../arduinoserver.js').createArduinoServer(false);

//retrieving json data
var jsonSensors = JSON.parse(fs.readFileSync(__dirname + '/../jsons/sensors.json'));
var jsonActuators = JSON.parse(fs.readFileSync(__dirname + '/../jsons/actuators.json'));

//init serial ports
var comSet = [];  // i REALLY need a comSet????
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
for (var i  = 0; i < comSet.length; i++){
    serials[i] = {name : comSet[i].COM , port : new SerialPort(comSet[i].COM, {
        baudrate : 9600,
        parser : SerialPort.parsers.readline('/n') //maybe a '##' readline parser would be more appropriate
    }, false)};
}

//arduinoServer.on('control', onControl);
//arduinoServer.on('getActuator', onGetActuator);
//arduinoServer.on('setActuator', onSetActuator);

//declaring events

    //data should contains something like id, value
function onSetActuator(data){
    findPort(jsonActuators, data, function(chunk){
        return '@h' + chunk.pin + cu
    });
}

function onGetActuator(){

}

function onControl(){

}

function findPort(jsonVector, data, callback){
    jsonVector.some(function(element){
        if(element.id == data.id){   //element.COM, lement.pin
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
