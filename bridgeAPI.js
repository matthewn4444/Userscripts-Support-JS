
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
 *      BRIDGE.css          (cssJson)
 *          This will apply a stylesheet built in JavaScript as an object or JSON object
 *  
 *  
 *  Support Documentation: (For Non-Firefox browsers like Chrome)    
 *      BRIDGE.support.read (variableString, callback);
 *          This reads a variable on the webpage, support for Chrome which cannot 
 *          do this natively. Firefox, you can just read the variable from the sandbox
 *
 *      BRIDGE.support.run  (function, callback, arguments);
 *          This allows you to run code with the webpage's context and return a value
 *          which goes into the callback provided. 
 *
 *  
 *  Parameters:
 *      function:       a function (closure) that wants to be executed
 *      argumentsObj:   an object that has variables that the function would use in its scope
 *      functionString: the name of the function which the webpage would use to run the function
 *      variableString: the variable name in a string which you are trying to read from webpage
 *      cssJson:        the JSON or object value that defines the CSS stylesheet    
 */
(function(window){
var registeredFunctions = {};
var needsSupport = !!window.mozAnimationStartTime;      // Needs support if not Firefox (eg. Chrome)

function isFunction(o) {
    return o && Object.prototype.toString.call( o ) === '[object Function]';
}

function appendScript (code) {
    var script = document.createElement("script");
    script.appendChild(document.createTextNode(code));
    document.body.appendChild(script);
}

function prepareFnString(fn) {
    var code = (fn+"")//.replace(/\n/g, "");    //Convert to string
    code = code.replace(/^[^{]*?{/, "");
    code = code.substring(0, code.lastIndexOf("}"));
    return code;
}

function addJs(fn, args) {
    // Organize the arguments passed into the script tag
    var codePrefix = "";
    for (var key in args) {
        if (args.hasOwnProperty(key)) {
            codePrefix += "var " + key + " = window.bridgeApiArguments." + key + "; ";
        }
    }
    if (codePrefix != "") {
        codePrefix += "delete window.bridgeApiArguments;";
        window.bridgeApiArguments = args;
    }
    
    // Make this a function
    appendScript(codePrefix + prepareFnString(fn));
}

// Add the API to window
window.BRIDGE = {
    add: function(fn, args) {
        if(!isFunction(fn)) {return this;}
        if (needsSupport) {
            addJsWithSupport(fn, args);
        } else {
            addJs(fn, args);
        }
        return this;
    },
    register: function(fnName, fn) {
        if (!isFunction(fn)) {return this;}
        registeredFunctions[fnName] = fn;
        
        if (!needsSupport) {
            var code = "function " + fnName + "() {\
                            bridgeApiCallRegisterFunction('" + fnName + "', arguments);\
                        }";
            appendScript(code);
        } else {    
            registerWithSupport(fnName);
        }
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
    css: function(cssJson) {
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
        return this;
    },
};

// Initalize
if (!needsSupport) {
    window.bridgeApiCallRegisterFunction = function(fnName, args) {
        if (registeredFunctions.hasOwnProperty(fnName)) {
            registeredFunctions[fnName].apply(window, args);
        }
    }
} else {
    var supportCallbackTable = {};
    
    // Support Events
    var EVENTS = {
        DOWN_ADD:   "com.userscript.bridgeapi/down/add",
        UP_RETURN:  "com.userscript.bridgeapi/up/return",
        UP_RUN:     "com.userscript.bridgeapi/up/run",
        DOWN_RUN:   "com.userscript.bridgeapi/down/run"
    };
    
    // Add the events to the page
    (function(){
        var eventCode = "(function(){window.EVENTS = {};";
        for (var evt in EVENTS) {
            eventCode += "window.EVENTS." + evt + "='" + EVENTS[evt] + "';";
        }
        appendScript(eventCode + "})();");
    })();

    function addJsWithSupport(fn, args) {
        window.dispatchEvent(new CustomEvent(EVENTS.DOWN_ADD, { detail: {
            code: prepareFnString(fn),
            arguments: args
        }}));
    }

    function runJsWithSupport(fnString, callback, args) {
        var id = Date.now();
        if (callback) { supportCallbackTable[id] = callback; }
        window.dispatchEvent(new CustomEvent(EVENTS.DOWN_RUN, { detail: {
            code: fnString,
            arguments: args,
            id: id
        }}));
    }
    
    function registerWithSupport(fnName) {
        var code = "function " + fnName + "() {\
                        window.dispatchEvent(new CustomEvent('" + EVENTS.UP_RUN + "', {detail : {\
                            fnName: '" + fnName + "',\
                            arguments: arguments\
                        }}));\
                    }";
        appendScript(code);
    }

    window.addEventListener(EVENTS.UP_RETURN, function(e){
        var id = e.detail.id,
            retVal = e.detail.returnVal;
        if (id && supportCallbackTable.hasOwnProperty(id)) {
            supportCallbackTable[id].call(window, retVal);
            delete supportCallbackTable[id];
        }
    }, false);
    
    window.addEventListener(EVENTS.UP_RUN, function(e){
        var fnName = e.detail.fnName;
        if (fnName && registeredFunctions.hasOwnProperty(fnName)) {
            // Since the arguments passed back is an object, we must turn it into an array
            var args = [];
            for (var i in e.detail.arguments) { args.push(e.detail.arguments[i]); }
            registeredFunctions[fnName].apply(window, args);
        }
    }, false);

    addJs(function(){
        (function(){
            window.addEventListener(EVENTS.DOWN_ADD, function(e){
                var code = e.detail.code;
                var args = e.detail.arguments;
                
                // Put the arguments in the page
                if (args) {
                    for (var i in args) {
                        window[i] = args[i];
                    }
                }
                // Strip the any return statements because it will kill the code then eval it
                eval(code.replace(/return[^;\n]*?(;|\n)/gm, ""));
            }, false);
            window.addEventListener(EVENTS.DOWN_RUN, function(e){
                var code = e.detail.code;
                var args = e.detail.arguments;
                var id = e.detail.id;
                
                // Put the arguments in the page
                if (args) {
                    for (var i in args) {
                        window[i] = args[i];
                    }
                }
                eval("var retVal = (function(){" + code + "})();");
                
                var e = new CustomEvent(EVENTS.UP_RETURN, { detail: {
                    returnVal: retVal,
                    id: id
                }});
                window.dispatchEvent(e);
            }, false);
        })();
    });
    
    // Add more functions for the support
    window.BRIDGE.support = {
        run: function(fn, arg1, arg2) {
            if (!isFunction(fn)) {return this;}
            var callback = isFunction(arg1) ? arg1 : arg2,
                args = isFunction(arg1) ? arg2 : arg1;
            runJsWithSupport(prepareFnString(fn), callback, args);
            return this;
        },
        read: function(variableName, callback) {
            if (!variableName || variableName == "") { return this; }
            runJsWithSupport("return " + variableName + ";", callback);
            return this;
        },
    };
}
})(window);
