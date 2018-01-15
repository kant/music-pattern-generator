/**
 * Base functionality for all MIDI processors.
 * @namespace WH
 */

window.WH = window.WH || {};

(function (WH) {
    
    function createMIDIProcessorBase(specs, my) {
        var that,
            type = specs.type,
            id = specs.id,
            
            /**
             * Create parameters from an object of parameter specifications.
             * @param  {Object} paramSpecs Definitions of all the processor's parameters. 
             */
            defineParams = function(paramSpecs) {
                for (var key in paramSpecs) {
                    paramSpecs[key].key = key;
                    switch(paramSpecs[key].type) {
                        case 'integer':
                            my.params[key] = WH.createIntegerParameter(paramSpecs[key]);
                            break;
                        case 'boolean':
                            my.params[key] = WH.createBooleanParameter(paramSpecs[key]);
                            break;
                        case 'itemized':
                            my.params[key] = WH.createItemizedParameter(paramSpecs[key]);
                            break;
                        case 'string':
                            my.params[key] = WH.createStringParameter(paramSpecs[key]);
                            break;
                        case 'vector2d':
                            my.params[key] = WH.createVector2DParameter(paramSpecs[key]);
                            break;
                    }
                    my.params[key].addChangedCallback(paramChangedCallback);
                }
                initParams();
            },
            
            /**
             * Set all parameter values from specs.
             */
            initParams = function() {
                for (var key in my.params) {
                    if (my.params.hasOwnProperty(key)) {
                        if (specs[key]) {
                            my.params[key].setValue(specs[key]);
                        }
                    }
                }
            },
            
            /**
             * Called by the processor's parameters if their value is changed.
             */
            paramChangedCallback = function(parameter, oldValue, newValue) {
                // call the plugin's handler for this parameter
                my['$' + parameter.getProperty('key')](newValue);
            },
            
            setParamValue = function(key, value) {
                if (my.params.hasOwnProperty(key)) {
                    my.params[key].setValue(value);
                }
            },
            
            getParamValue = function(key) {
                if (my.params.hasOwnProperty(key)) {
                    return my.params[key].getValue();
                }
            },
            
            getParameters = function() {
                return my.params;
            },
            
            hasParameter = function(param) {
                for (var key in my.params) {
                    if (my.params.hasOwnProperty(key)) {
                        if (my.params[key] === param) {
                            return true;
                        }
                    }
                }
                return false;
            },
            
            /**
             * General processor info.
             * @return {Object} Processor properties info.
             */
            getInfo = function() {
                return my.info;
            },
            
            getType = function() {
                return type;
            },
            
            setID = function(newId) {
                id = newId;
            },
            
            getID = function() {
                return id;
            },
            
            /**
             * Restore processor from data object.
             * @param {Object} data Preferences data object.
             */
            setData = function(data) {
                for (var key in my.params) {
                    if (my.params.hasOwnProperty(key)) {
                        my.params[key].setData(data[key]);
                    }
                }
            }, 
            
            /**
             * Write processor settings to data object.
             */
            getData = function() {
                var data = {};
                data.type = type;
                data.id = id;
                
                // parameters
                for (var key in my.params) {
                    if (my.params.hasOwnProperty(key)) {
                        data[key] = my.params[key].getData();
                    }
                }
                
                // connections
                if (typeof my.getDestinationsData == 'function') {
                    my.getDestinationsData(data);
                }
                
                // processor specific data
                if (typeof my.getProcessorSpecificData == 'function') {
                    my.getProcessorSpecificData(data);
                }
                return data;
            };
       
        my = my || {};
        my.params = my.param || {};
        my.defineParams = defineParams;
        
        that = specs.that || {};
        if (my.info.inputs == 1) {
            that = WH.createMIDIConnectorIn(specs, my);
        }
        if (my.info.outputs == 1) {
            that = WH.createMIDIConnectorOut(specs, my);
        }
        
        that.setParamValue = setParamValue;
        that.getParamValue = getParamValue;
        that.getParameters = getParameters;
        that.hasParameter = hasParameter;
        that.getInfo = getInfo;
        that.getType = getType;
        that.setID = setID;
        that.getID = getID;
        that.setData = setData;
        that.getData = getData;
        
        return that;
    }
    
    WH.createMIDIProcessorBase = createMIDIProcessorBase;

})(WH);