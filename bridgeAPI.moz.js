/*==================================*\
              BRIDGE API
\*==================================*/
/*
 *  This API allows code to be executed from the a userscript to the webpage
 *  with ease. It allows the webpage to call functions inside the userscript
 *  seemingly removes the gap between userscript and the webpage.
 *
 *  Documentation:
 *      BRIDGE.add          (function, argumentsObj);
 *          This adds JavaScript to the page, JavaScript executes with the scope of the webpage        
 *
 *      BRIDGE.register     (functionString, function);
 *          This registers a function so that the webpage can call the function string
 *          as if the function in the userscript also exists in the webpage    
 *
 *      BRIDGE.unregister   (functionString);
 *          This unregisters the function from being able to be called from the webpage           
 *
 *
 *  Parameters:
 *      function:       a function (closure) that wants to be executed
 *      argumentsObj:   an object that has variables that the function would use in its scope
 *      functionString: the name of the function which the webpage would use to run the function
 */
(function(window){
var registeredFunctions = {};

function isFunction(o) {
    return o && Object.prototype.toString.call( o ) === '[object Function]';
}

function appendScript (code) {
    var script = document.createElement("script");
    script.appendChild(document.createTextNode(code));
    document.body.appendChild(script);
}

function prepareFnString(fn) {
    var code = (fn+"").replace(/\n/g, "");    //Convert to string
    code = code.replace(/^[^{]*?{/, "");
    code = code.substring(0, code.lastIndexOf("}"));
    return code;
}

function addJs(fn, arguments) {
    // Organize the arguments passed into the script tag
    var codePrefix = "";
    for (var key in arguments) {
        if (arguments.hasOwnProperty(key)) {
            codePrefix += "var " + key + " = window.bridgeApiArguments." + key + "; ";
        }
    }
    if (codePrefix != "") {
        codePrefix += "delete window.bridgeApiArguments;";
        window.bridgeApiArguments = arguments;
    }
    
    // Make this a function
    appendScript(codePrefix + prepareFnString(fn));
}

window.bridgeApiCallRegisterFunction = function(fnName, arguments) {
    if (registeredFunctions.hasOwnProperty(fnName)) {
        registeredFunctions[fnName].apply(window, arguments);
    }
}

// Add the API to window
window.BRIDGE = {
    add: function(fn, arguments) {
        if(!isFunction(fn)) {return;}
        addJs(fn, arguments);
        return this;
    },
    register: function(fnName, fn) {
        if (!isFunction(fn)) {return;}
        registeredFunctions[fnName] = fn;
        
        var code = "function " + fnName + "() {\
                        bridgeApiCallRegisterFunction('" + fnName + "', arguments);\
                    }";
        appendScript(code);
        return this;
    },
    unregister: function(fnName) {
        if (registeredFunctions.hasOwnProperty(fnName)) {
            delete registeredFunctions.fnName;
            var code = fnName + " = null";
            appendScript(code);
        }
        return this;
    },
};
})(window);