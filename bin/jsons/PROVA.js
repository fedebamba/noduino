
var serialport = require('serialport');
var SerialPort = serialport.SerialPort;
var fs = require('fs');


var EventEmitter = require('events').EventEmitter;
var culo = new EventEmitter;





var port = new SerialPort('COM3', {baudrate : 9600, parser : serialport.parsers.readline('#')}, false);







culo.on('s', function(){
    port.write('@sen:');
    console.log('ok3');
});



console.log('ok1');
port.open(function(error){
    console.log('ok2');
    port.on('data', function(data){
        console.log('data arrived' + data);
        if(data == '@ack#'){
            console.log('received');
        }
        culo.emit('s');
    });

});
