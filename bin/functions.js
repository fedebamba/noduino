/**
 * Created by Bamba on 28/09/2015.
 */



module.exports = {
    and : function(parameters){
        if (parameters === undefined){
            return false;
        }
        var result = parameters[0];
        for(var i = 1; i < parameters.length; i++){
            result = result && parameters[i];
        }
        return Boolean(result);
    },

    or : function(parameters){
        if (parameters === undefined){
            return false;
        }
        var result = parameters[0];
        for(var i = 1; i < parameters.length; i++){
            result = result || parameters[i];
        }
        return Boolean(result);
    },

    not : function(parameter){
        return (parameter == undefined || parameter.length != 1) ? false : !Boolean(parameter[0]);
    },

    transistor : function(parameters){
        if(parameters == undefined || parameters.length != 2){
            return 0;
        }
        return Boolean(parameters[0]) == true ? parameters[1] : 0;
    },

    greaterThan : function(parameters){
        if(parameters == undefined || parameters.length != 2){
            return 0;
        }
        return Boolean(parameters[0] > parameters[1]);
    },

    lesserThan : function(parameters){
        if(parameters == undefined || parameters.length != 2){
            return 0;
        }
        return Boolean(parameters[0] < parameters[1]);
    },

    min : function(parameters){
        if(parameters == undefined){
            return 0;
        }
        var _min = parameters[0];
        for (var i = 1; i < parameters.length; i++){
            _min = _min > parameters[i] ? parameters[i] : _min;
        }
        return _min;
    },

    max : function(parameters){
        if(parameters == undefined){
            return 0;
        }
        var _max = parameters[0];
        for (var i = 1; i < parameters.length; i++){
            _max = _max < parameters[i] ? parameters[i] : _max;
        }
        return _max;
    },

    threshold : function(parameter, value){
        if (parameter == undefined || parameter.length > 1){
            return 0;
        }
        return parameter[0] > value;
    },

    divideByTen : function(parameter){
        return Math.floor(parameter[0]);
    }

};



