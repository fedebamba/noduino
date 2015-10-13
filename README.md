# noduino

A simple server in node.js that talks with an Arduino network

<b>ArduinoServer.createArduinoServer(options)</b>
  create a new instance of ArduinoServer, which is also an instance of EventEmitter; it initialize the server but does not start it (this should be done emitting the 'start' event, see below);
  
  options:
    -sensorsFilename (default sensors.json )
      specifies the name of the file from which the server load the sensors data; thsi file must be placed in the 'jsons' 
      folder.
    -treesFilename (default trees.json )
      specifies the name of the file from which the server load the trees data; this file must be placed in the 'jsons' 
      folder, andcontains information about the relations bettween sensors and actuators.
    -functionsFilename(default functions.js)
      specifies the file containing the various modular functions
      
  Arduino server is basically an EventEmitter, so it listen for some events and emits other events accordingly;
  you should listen to, and emitting 'start' and 'sense' event 
  
  Events the server is listen for:
  
  <b>Event : start</b>
    Starts the server, thet begin to emit setup event to configure the network, and listening to other events;
    it is crucial that 'start' is emitted before any other event.
    
  <b>Event : sense  {id, value}</b>
    Tells the server that the sensor with the specified 'id' has measured 'value'; 
    
  Events the server emits  
  
  <b>Event : control {id}</b>
    Declare the existence of a sensor with the specified 'id'.
  
  <b>Event : setActuator {id, value}</b>
    Tells that the actuator referenced by id shoud be setted at value;
    
  <b>Event : getActuator</b>
    Require the state of the actuator referenced by id;
