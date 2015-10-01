/**
 * Created by Bamba on 26/09/2015.
 */

//include and global variables-----------------------------------------------------------------------
var EventEmitter = require('events').EventEmitter;
var FS = require('fs');

var functions = require('./functions.js');

var sensorStateVector = [];
var actuatorStateVector = [];
var functionVector = [];
var jsonSensors = {};
var jsonTreesAsArray = {};
var trueJsonTrees = {};

var arduinoServer = {};


module.exports.createArduinoServer = function(options){
    //set default values
    var defaultValue = {
        sensorsFilename : 'sensors.json',
        treesFilename : 'trees.json',
        functionsFilename : 'functions.js'
    };
    for(var i in defaultValue){
        defaultValue[i] = (typeof options[i] == "undefined") ? defaultValue[i] : options[i];
    }

    //creating server
    arduinoServer = new EventEmitter();

    //retrieving json data
    jsonTreesAsArray = JSON.parse(FS.readFileSync(__dirname +"/"+ defaultValue.treesFilename, 'utf8'));
    jsonSensors = createActuatorReferenceMap(JSON.parse(FS.readFileSync(__dirname +"/"+defaultValue.sensorsFilename, 'utf8')));
    trueJsonTrees = createJsonTrees(__dirname +"/"+jsonTreesAsArray);

    //init state vector;
    for(var i = 0; i < jsonSensors.length; i++){
        sensorStateVector[i] = {"sensorId" : jsonSensors[i].id, "sensorValue" : NaN};
    }
    for(var i = 0; i < trueJsonTrees.length; i++) {
        actuatorStateVector[i] = {"actuatorId": trueJsonTrees[i].id, "actuatorValue": NaN};
    }

    //generating actuator control routines;
    for(var i = 0; i < trueJsonTrees.length; i++){
        functionVector[i] = {"id" : trueJsonTrees[i].id, "controlRoutine" : eval(stringFromRoot(trueJsonTrees[i]))};
    }

    //attaching events;
    arduinoServer.on('start', function(){
        arduinoServer.on('sense', onSense);
        startConnection();
    });

    return arduinoServer;
};


//event listener definition---------------------------------------------------------------------------------------------
function startConnection(){
    for(var i = 0; i < jsonSensors.length; i++){
        arduinoServer.emit('control', {"sensor" : jsonSensors[i].id});
    }

    //todo : continue
}

function onSense(measure){
    //console.log('sensor: ' + measure.id + 'measures:  ' + measure.value);

    //update sensor state vector;
    sensorStateVector.some(function(element){
        if(element.sensorId == measure.id){
            element.sensorValue = measure.value;
            return true;
        }
    });

    //find actuators that depends from sensed sensor
    var potentiallyVariatedActuators = [];
    jsonSensors.some(function(element){
        if(element.id == measure.id){
            potentiallyVariatedActuators = element.actuators;
            return true;
        }
    });

    //begin control routine for each selected actuator and emit command
    for (var j = 0; j < potentiallyVariatedActuators.length; j++){
        for(var k = 0; k < functionVector.length; k++){
            if(functionVector[k].id == potentiallyVariatedActuators[j].id){
                console.log('ok + ' + functionVector[k]);
                var result = functionVector[k].controlRoutine();
                for (var index = 0; index < actuatorStateVector.length; index++){
                    if ((actuatorStateVector[index].actuatorId == functionVector[k].id) &&(result != actuatorStateVector[index].actuatorValue)){
                        arduinoServer.emit('setActuator', {"id" : actuatorStateVector[index].actuatorId, "value" : result});
                        actuatorStateVector[index] = result;
                    }
                }
            }
        }
    }

}

//function for managing json--------------------------------------------------------------------------------------------
function createJsonTrees(){
    var tmpJsonTrees = [];
    for (var i = 0; i < jsonTreesAsArray.length; i++){
        tmpJsonTrees[i] = createJsonTreeFromRoot(jsonTreesAsArray[i]);
    }
    function createJsonTreeFromRoot(jsonArray){
        var i = 0;
        while(jsonArray[i].parent != undefined){
            i++;
        }
        function createASingleTree(jsonArray, jsonTreeNode){
            var jsonNode = jsonTreeNode;
            if (jsonNode.children != undefined){
                for(var i = 0; i < jsonNode.children.length; i++){
                    for (var j = 0; j < jsonArray.length; j++){
                        if( jsonArray[j].id == jsonNode.children[i]){
                            jsonNode.children[i] = createASingleTree(jsonArray, jsonArray[j]);
                        }
                    }
                }
            }
            return jsonNode;
        }
        return createASingleTree(jsonArray, jsonArray[i]);
    }
    return tmpJsonTrees;
}

function createActuatorReferenceMap(tmpJsonSensors){
    var jsonSensorResult = [];
    for (var i = 0; i < tmpJsonSensors.length; i++){
        console.log(jsonTreesAsArray.length);
        jsonSensorResult[i] = {id : tmpJsonSensors[i].id, tag : tmpJsonSensors[i].tag, actuators : []};
        for (var j = 0; j < jsonTreesAsArray.length; j++){
            for (var k = 0; k < jsonTreesAsArray[j].length; k++){
                if (jsonTreesAsArray[j][k].type == "actuator" && tmpJsonSensors[i].actuators.contains(jsonTreesAsArray[j][k].id)){
                    jsonSensorResult[i].actuators[jsonSensorResult[i].actuators.length] = jsonTreesAsArray[j][k];
                }
            }
        }
    }
    return jsonSensorResult;
}

function createComSet(){
    var comSet = [];
    for(var i = 0; i < jsonSensors.length; i++){
        var newCom = true;
        for (var j = 0; j < comSet.length; j++){
            if(typeof comSet[j] != 'undefined' && typeof comSet[j].COM != 'undefined' ){
                if (comSet[j].COM == jsonSensors[i].COM){
                    newCom = false;
                    comSet[j].sensors[comSet[j].sensors.length] = jsonSensors[i].id;
                }
            }
        }
        if(newCom){
            comSet[comSet.length] = {"COM" : jsonSensors[i].COM, "sensors" : [jsonSensors[i].id]};
        }
    }
    return comSet;
}

//various utility functions---------------------------------------------------------------------------------------------
function stringFromRoot(root){
    var string = buildStringFunction(root);
    string += ';';
    function buildStringFunction(node){
        var string  = '';
        if(node.children != undefined && node.children.length > 0){
            if(node.type.indexOf('block') > -1){
                string = 'functions.' + node.function + '.treeLikeCompose([';
            }
            for (var i = 0; i < node.children.length; i++){
                string = string + buildStringFunction(node.children[i]) + ', ';
            }
            string = string.slice(0, -2);
            if(node.type.indexOf('block') > -1){
                string += '])';
            }
        }
        else{
            string += 'function(){return sensorStateVector[' + node.id + '];}'
        }
        return string;
    }
    return string;
}

//prototype functions---------------------------------------------------------------------------------------------------
Array.prototype.contains = function(obj){
    var result = false;
    for(var i = 0; i < this.length; i++){
        if(this[i] == obj)
            result =true;
    }
    return result;
}

Function.prototype.treeLikeCompose = function(fArray){
    var fn = this;
    return function(){
        var param = [];
        for(var i = 0, len = fArray.length; i < len; i++ ){
            param[i] = fArray[i].apply(this, arguments);
        }
        return fn(param);
    }
}