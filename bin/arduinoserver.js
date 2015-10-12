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
        actuatorsFilename : 'actuators.json',
        treesFilename : 'trees.json',
        functionsFilename : 'functions.js'
    };
    for(var i in defaultValue){
        defaultValue[i] = (typeof options[i] == "undefined") ? defaultValue[i] : options[i];
    }

    //creating server
    arduinoServer = new EventEmitter();

    //retrieving json data
    jsonTreesAsArray = JSON.parse(FS.readFileSync(__dirname + '/jsons/' + defaultValue.treesFilename, 'utf8'));
    jsonSensors = createActuatorReferenceMap(JSON.parse(FS.readFileSync(__dirname + '/jsons/' + defaultValue.sensorsFilename, 'utf8')));
    jsonActuators = JSON.parse(FS.readFileSync(__dirname + '/jsons/' + defaultValue.actuatorsFilename, 'utf8'));
    trueJsonTrees = createJsonTrees(jsonTreesAsArray);

    //init state vector;
    for(var i = 0; i < jsonSensors.length; i++){
        sensorStateVector[i] = {"sensorId" : jsonSensors[i].id, "sensorValue" : NaN};
    }
    for(var i = 0; i < jsonActuators.length; i++) {
        actuatorStateVector[i] = {"actuatorId": jsonActuators[i].id, "actuatorValue": NaN};
    }

    //generating actuator control routines;
    for(var i = 0; i < trueJsonTrees.length; i++){
        functionVector[i] = {"id" : trueJsonTrees[i].id, "controlRoutine" : treeVisit(trueJsonTrees[i])};
    }

    //attaching events;
    arduinoServer.on('start', function(){
        arduinoServer.on('sense', onSense);
        arduinoServer.on('setup', onSetup);
        startConnection();
    });

    return arduinoServer;
};


//event listener definition---------------------------------------------------------------------------------------------
function startConnection(){
    console.log('Starting network setup...');
    onSetup();
    //todo : continue
    console.log('Network setup Started');
}

function onSetup(){
    //console.log('               -------------------------');
    for(var i = 0; i < jsonSensors.length; i++){
        arduinoServer.emit('control', {"sensor" : jsonSensors[i].id});
    }
    for (var j = 0; j < trueJsonTrees.length; j++){
        arduinoServer.emit('getActuator' , {actuator : trueJsonTrees[j].id});
    }
}

function onSense(measure){
    //console.log('sensor: ' + measure.id + ' measures:  ' + measure.value);

    //update sensor state vector;
    sensorStateVector.some(function(element){
        if(element.sensorId == measure.id){
            element.sensorValue = measure.value;
            return true;
        }
    });
    console.log(sensorStateVector);
    console.log(actuatorStateVector);
    //find actuators that depends from sensed sensor
    var potentiallyVariatedActuators = [];
    jsonSensors.some(function(element){
        console.log(element.id + ' ,  ' + measure.id);

        if(element.id == measure.id){
            console.log('                                      ' + element.actuators);
            potentiallyVariatedActuators = element.actuators;
            console.log('actuators: ' + element.actuators);
            return true;
        }
    });
    //begin control routine for each selected actuator and emit command
    for (var j = 0; j < potentiallyVariatedActuators.length; j++){
        for(var k = 0; k < functionVector.length; k++){
            if(functionVector[k].id == potentiallyVariatedActuators[j].id){
                var result;
                trueJsonTrees.some(function(element){
                    if(element.id == functionVector[k].id){
                        //console.log('treevisit :' + treeVisit(element.children[0]   ));
                        result = treeVisit(element.children[0]);
                        return true;
                    }
                });

                for (var index = 0; index < actuatorStateVector.length; index++){
                    if ((actuatorStateVector[index].actuatorId == functionVector[k].id)){
                        arduinoServer.emit('setActuator', {"id" : actuatorStateVector[index].actuatorId, "value" : result});
                        actuatorStateVector[index].actuatorValue = result;
                        console.log(result);
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

            if (jsonNode.children != undefined && jsonNode.children.length > 0){
                for(var i = 0; i < jsonNode.children.length; i++){
                    for (var j = 0; j < jsonArray.length; j++){
                        if( jsonArray[j].id == jsonNode.children[i]){
                            jsonNode.children[i] = createASingleTree(jsonArray, jsonArray[j]);
                        }
                    }
                }
            }

            //find function
            if(jsonNode.function != undefined){
                jsonNode.function = eval('functions.' + jsonNode.function);
            }
            else if(jsonNode.type.indexOf('SENS') > -1){
                jsonNode.function = function(node){
                    var id = node.id;
                    var itr = NaN;
                    sensorStateVector.some(function(element){
                        if(element.sensorId == id){
                            itr = element.sensorValue;
                            return true;
                        }
                    });
                    //console.log('state :  '+sensorStateVector[id]);
                    return itr;
                };
            }
            else if(jsonNode.type.indexOf('ACTU') > -1){
                jsonNode.function = function(){
                    var child = jsonNode.children[0];
                    return child.function;
                };
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
        jsonSensorResult[i] = {id : tmpJsonSensors[i].id, tag : tmpJsonSensors[i].tag, actuators : []};
        for (var j = 0; j < jsonTreesAsArray.length; j++){
            for (var k = 0; k < jsonTreesAsArray[j].length; k++){
                if (jsonTreesAsArray[j][k].type == "ACTU" && tmpJsonSensors[i].actuators.contains(jsonTreesAsArray[j][k].id)){
                    jsonSensorResult[i].actuators[jsonSensorResult[i].actuators.length] = jsonTreesAsArray[j][k];
                }
            }
        }
    }
    return jsonSensorResult;
}

function treeVisit(node){
    if(node.children != undefined && node.children.length > 0){
        var param = [];
        for (var i = 0; i < node.children.length; i++){
            param[i] = treeVisit(node.children[i]);
        }
        return node.value != undefined ? node.function(param, value) : node.function(param);
    }
    else{
        return node.function(node);
    }
}


//various utility functions---------------------------------------------------------------------------------------------
function stringFromRoot(root){
    var string = buildStringFunction(root);
    string += ';';
    function buildStringFunction(node){
        var string  = '';
        if(node.children != undefined && node.children.length > 0){
            if(node.type.indexOf('BLOC') > -1){
                string = 'functions.' + node.function + '.treeLikeCompose([';
            }
            for (var i = 0; i < node.children.length; i++){
                string = string + buildStringFunction(node.children[i]) + ', ';
            }
            string = string.slice(0, -2);
            if(node.type.indexOf('BLOC') > -1){
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
};

Function.prototype.treeLikeCompose = function(fArray) {
    var fn = this;
    return function () {
        var param = [];
        for (var i = 0, len = fArray.length; i < len; i++) {
            param[i] = fArray[i].apply(this, arguments);
        }
        return fn(param);
    };
};
