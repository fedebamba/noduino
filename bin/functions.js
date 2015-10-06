/**
 * Created by Bamba on 28/09/2015.
 */



module.exports = {
    /**
     @name:And#
     @descr:And logico tra due o più ingressi#
     */
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

    /**
     @name:Or#
     @descr:Or logico tra due o più ingressi#
     */
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

    /**
     @name:Not#
     @param:1#
     @descr:Not logico dell'ingresso#
     */
    not : function(parameter){
        return (parameter == undefined || parameter.length != 1) ? false : !Boolean(parameter[0]);
    },

    /**
     @name:Transistor#
     @param:12#
     @descr:Restituisce il valore del secondo ingresso se il primo risulta vero, e 0 alrimenti#
     */
    transistor : function(parameters){
        if(parameters == undefined || parameters.length != 2){
            return 0;
        }
        return Boolean(parameters[0]) == true ? parameters[1] : 0;
    },

    /**
     @name:GreaterThan#
     @param:2#
     @descr:Restituisce true se il primo ingresso è strettamente maggiore del secondo #
     */
    greaterThan : function(parameters){
        if(parameters == undefined || parameters.length != 2){
            return 0;
        }
        return Boolean(parameters[0] > parameters[1]);
    },

    /**
     @name:LesserThan#
     @param:2#
     @descr:Restituisce true se il primo ingresso è strettamente minore del secondo #
     */
    lesserThan : function(parameters){
        if(parameters == undefined || parameters.length != 2){
            return 0;
        }
        return Boolean(parameters[0] < parameters[1]);
    },

    /**
     @name:Min#
     @descr:Restituisce il minimo tra gli ingressi#
     */
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

    /**
     @name:Max#
     @descr:Restituisce il massimo tra gli ingressi#
     */
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
    }

};



