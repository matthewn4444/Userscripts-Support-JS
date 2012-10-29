/*==================================*\
|*      __USERSCRIPTS_BRIDGE__      *|
\*==================================*/
/**
 *    Functions that accept 'arguments', must be formatted by {varNamePageNamespace: varFromUserscriptNamespace}
 *    Return values can only be strings, ints and booleans, no object! To store arrays, use a string delimited by commas
 *    Independent of 3rd party libraries
 *    Implementation:
 *       BRIDGE.registerFunction(nameOfFunction, functionObj);
 *       BRIDGE.unregisterFunction(nameOfFunction);
 *       BRIDGE.addFunction(nameOfFunction, codeOfFunction);
 *       BRIDGE.addJS(jsCode, arguments);
 *       BRIDGE.addCSS(cssObj);
 *       BRIDGE.run(codeOfFunction, callbackFunction, arguments);
 *       BRIDGE.read(varName, callbackFunction, arguments);
 */
(function(window) {
    var NULL_CHAR = "(|||)",
        BRIDGEOBJ = null,
        BRIDGE_ID = "USERSCRIPT_BRIDGE";

    function isArray(o) {
        return Object.prototype.toString.call( o ) === '[object Array]';
    }
    function isObject(o) {
        return Object.prototype.toString.call( o ) === '[object Object]';
    }
    function isString(o) {
        return Object.prototype.toString.call( o ) === '[object String]';
    }
    function isFunction(o) {
        return Object.prototype.toString.call( o ) === '[object Function]';
    }
    function handleArguments(code, args) {
        if(args  == null) {return code;}

        //Loop through each and place the initial varibles
        var initVar = "";
        for(var variable in args) {
            var value = args[variable];
            if (isArray(value)) {
                value = "('" + value.join("|||") + "').split('|||')";     //each '%7C' is '|'
            } else if (typeof(value) == "string" || typeof(value) == "object") {
                value = "'" + value + "'";
            }
            initVar += "var " + variable + " = " + value + ";";
        }
        return (code + "").replace(/^[^{]*?{/, "function(){" + initVar);
    }
    
    function appendScript (code) {
        var script = document.createElement("script");
        script.appendChild(document.createTextNode(code));
        BRIDGEOBJ.appendChild(script);
    }
    
    var bridge = {
        callback          : function(){},
        GMFunctions       : [],
        runQueue          : [],  //Glitch in chrome that window.location has timing issues so it must be synchronized
        isRunningCommand  : false,
        init: function() {
            //Do allow the init to happen if the object exists
            if(document.getElementById(BRIDGE_ID)){return;}
          
            //Add the passing function
            var pass = document.createElement("div");
            pass.style.visiblity = "hidden"; pass.id = BRIDGE_ID;
            document.body.appendChild(pass);
            BRIDGEOBJ = pass;
         
            //Attach detecting function events to page
            this.addJS(function() {
            if(bridge_evt1 == null) {
                var bridge_evt1 = document.createEvent("Event");
                bridge_evt1.initEvent("BRIDGE_RETURN", true, true);
            }
            if(bridge_evt2 == null) {
                var bridge_evt2 = document.createEvent("Event");
                bridge_evt2.initEvent("BRIDGE_RUNFUNCTION", true, true);
            }
            if(bridge_evt3 == null) {
                var bridge_evt3 = document.createEvent("Event");
                bridge_evt3.initEvent("BRIDGE_RUNNEXTCOMMAND", true, true);
            }
            //Throws and returns a value
            function throwBridgeEvent(value) {
                if (value != null) {
                   document.getElementById(BRIDGE_ID).setAttribute("return", value);
                } else {
                   document.getElementById(BRIDGE_ID).removeAttribute("return");
                }
                document.dispatchEvent(bridge_evt1);
             }
             function runNextBridgeFunction() {
                document.dispatchEvent(bridge_evt3);
             }
             function convertArgumentsToBridgePass(obj) { 
                if(Object.prototype.toString.call( obj ) === '[object Arguments]' 
                    && Object.prototype.toString.call( obj ) === '[object Object]' 
                    || arguments.length == 0) {
                    return null;
                }
                //Check each arguement and form a string to pass
                var returnStr = '';
                var currentObj = obj[0];
                if (currentObj != null) {
                    if((typeof currentObj).toLowerCase() != "object") {
                        returnStr += currentObj;
                    } else if (isArray(currentObj)) {
                        returnStr += currentObj.join(NULL_CHAR);
                    } else {
                        return null;
                    }
                } else {
                    returnStr += NULL_CHAR;
                }
                for(var i=1; i<obj.length;i++) {
                    returnStr += "[|||]";   //<---separate arguments
                    currentObj = obj[i];
                    if (currentObj != null) {
                        if(isObject(currentObj)) {
                            returnStr += currentObj;
                        } else if (isArray(currentObj)) {
                            returnStr += currentObj.join(NULL_CHAR);
                        } else {
                            return null;
                        }
                    }
                    else {
                        returnStr += NULL_CHAR;
                    }
                }
                return returnStr;
            }
            }, {BRIDGE_ID: BRIDGE_ID, NULL_CHAR: NULL_CHAR});
          
            //Attach event and define the callback
            function bridgeReturnSimpleValue() { 
                //Save and send the data
                if(bridge.callback) {
                    var value = BRIDGEOBJ.getAttribute("return");
                    if (value) {
                        //Parse the value by type
                        if (value.length > 1 && value.charAt(0) == "0") {
                            //Do nothing, leave number with leading zeros alone
                        } else if(value*1 == value) { //Int
                            value *= 1;
                        } else {
                            switch( value.toUpperCase() ) {
                                //Boolean
                                case "FALSE":  value = false; break;
                                case "TRUE":   value = true;  break;
                            }
                        }
                    }
                    bridge.callback(value);
                    bridge.callback = null;
                }
            }
            function handleGMFunction() {
                //Pass arguments into the new function
                var args = BRIDGEOBJ.getAttribute("pass");
                if (args != null) {
                    args = args.split("[|||]");
                    BRIDGEOBJ.removeAttribute("pass");
                    var tempArgs = [];
                    //Parse arguments if null exists
                    for(var i=0;i<args.length;i++) {
                        if (args[i] == NULL_CHAR) {
                            tempArgs.push(null);
                        } else if(args[i].indexOf("{|||}") != -1) {  
                            tempArgs.push(args[i].split("{|||}"));
                        } else {
                            var value = args[i];
                            switch( value.toUpperCase() ) {
                                //Boolean
                                case "FALSE":  value = false; break;
                                case "TRUE":   value = true;  break;
                            }
                            tempArgs.push(value);
                        }
                    }
                    args = tempArgs;
                } else {
                    args = null;
                }
                var value = BRIDGEOBJ.getAttribute("run");
                BRIDGEOBJ.removeAttribute("run");
                //Run the function here
                var returnVal = bridge.GMFunctions[value].apply(this,args);
                if (returnVal != null) {
                    BRIDGEOBJ.setAttribute("return", returnVal);
                } else {
                    BRIDGEOBJ.removeAttribute("return");
                }
            }
            document.addEventListener("BRIDGE_RETURN", bridgeReturnSimpleValue, false);
            document.addEventListener("BRIDGE_RUNFUNCTION", handleGMFunction, false);
            document.addEventListener("BRIDGE_RUNNEXTCOMMAND", this.runNextQueueCommand, false);
        },
        //Registers a function in the userscript namespace and can be called from the page
        registerFunction : function(name, function_code) {
            this.GMFunctions[name] = function_code;
          
            //Place the a copy of the function on the dom but still calls up here
            this.addFunction(name, function(){
                var args = convertArgumentsToBridgePass(arguments);
                var bridgeObj = document.getElementById(BRIDGE_ID);
                if(args != null) {
                    bridgeObj.setAttribute("pass", args);
                }
                bridgeObj.setAttribute("run", function_name);
                document.dispatchEvent(bridge_evt2);
                var value = bridgeObj.getAttribute("return");
                if (value) {
                    //Parse the return value by type
                    if(value.length > 1 && value.charAt(0) == "0") {
                        //Do nothing, leading 0 number then leave it as string
                    } else if(value*1 == value){               //Int
                        value *= 1;
                    }else{
                        switch( value.toUpperCase() ) {
                            //Boolean
                            case "FALSE":  value = false; break;
                            case "TRUE":   value = true;  break;
                        }
                    }
                }
                return value;
            }, {function_name: name, BRIDGE_ID: BRIDGE_ID});
        },
        //Unregisters a userscript function
        unregisterFunction : function(name) {
            if(this.GMFunctions.hasOwnProperty(name)) {
                this.GMFunctions[name] = null;
             
                //Nulls the function on the page
                appendScript(name + " = null;");
                return true;
            }
            return false;
        },
        //Adds some javascript to the page
        addJS : function( code, arguments ) {
            if(code == null) {return;}
            //Check to see if its a function then remove the function part and the last }
            if(typeof(code) == "function") {  
                code = handleArguments(code, arguments);
             
                //Strips the function(){} wrapper
                code =  (code+"").replace(/\n/g, "");    //Convert to string
                code = code.replace(/^[^{]*?{/, "");
                code = code.substring(0, code.lastIndexOf("}"));
                appendScript(code);
            }
        },
        //Adds CSS to the body inputting a css object
        addCSS: function(cssObj) {
            var cssString = "",
                propString = "",
                eachSelector = "",
                style = document.createElement("style");
            for(var selector in CSS) {
                eachSelector = CSS[selector];
                propString = "";
                for(var property in eachSelector) {
                    propString += property + ":" + eachSelector[property] + ";";
                }
                cssString += selector + "{" + propString + "}";
            }
            style.appendChild(document.createTextNode(cssString));
            document.head.appendChild(style);
        },
        //Adds a function to the page
        addFunction : function(name, function_code, arguments) {  
            if (function_code == null){ function_code = function(){}; }
            //Add the function with the name and function
            function_code = handleArguments(function_code, arguments);
          
            if(function_code == null || name == null) {return;}
            var code = (function_code+"").replace("function", "function " + name);
            appendScript(code);
        },
        //Get a variable from the namespace of the page, asynchonized
        read : function ( _global_var, _callback, _arguments ) {
            this.run("function(){throwBridgeEvent(" + _global_var + ");}", _callback, _arguments);
        },
        //Execute code on the webpage
        run : function( _function_code, _callback, _arguments ) {
            _function_code = handleArguments(_function_code, _arguments);
            if(_function_code == null) {return;}

            //escape() is a workaround so that code is not interpreted incorrectly
            if(_callback != null && isFunction(_callback)){
                this.runQueue.push({
                    callback: _callback,
                    command: "throwBridgeEvent( (" + escape(_function_code) + ")() );runNextBridgeFunction();"
                });
            }else{
                this.runQueue.push({
                    callback: _callback,
                    command: "(" + escape(_function_code) + ")();runNextBridgeFunction();"
                });
            }
            //Attempt to run the command in the queue
            this.runNextQueueCommand();
        },
        //Miscellaneous - Internal
        runNextQueueCommand : function(evt) {
            //IF there was an event, this was called via last queue item was finished
            if(evt) {
                bridge.isRunningCommand = false;
            }
            //Run something in the queue
            if(bridge.runQueue.length > 0) {
                if (!bridge.isRunningCommand) {
                    bridge.isRunningCommand = true;
                    var item = bridge.runQueue.shift();
                
                    var callback   = item.callback;
                    var command    = item.command;
                
                    //Set the last callback and run
                    bridge.callback = callback;
                    location.href = ("javascript:" + command);
                    item = null;
                }
            } else {
                //Finished
                bridge.isRunningCommand = false;
            }
        },
    };
    bridge.init();
    window['BRIDGE'] = bridge;
})(window);