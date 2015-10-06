/*
//declaring events
function onSetActuator(data){
    comSet.some(function(element){
        console.log(element);
        if(data.id == element.id){
            serials.some(function(com){
                if(element.COM == com.name){
                    var string = '@h' + element.pin + data.value + '##';
                    console.log(string);
                    return true;
                }
            });
            return true;
        }
    });
}*/



var serialport = require('serialport');
var SerialPort = serialport.SerialPort;

var s = new SerialPort('COM1', false);

// list serial ports:
serialport.list(function (err, ports) {
    ports.forEach(function(port) {
        console.log(port.comName);
    });
});