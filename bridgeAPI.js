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
 *       BRIDGE.run(codeOfFunction, callbackFunction, arguments);
 *       BRIDGE.click(objectToBeClicked);
 *       BRIDGE.read(varName, callbackFunction, arguments);
 */
var BRIDGE = {
   returnObj         : null,
   callback          : function(){},
   GMFunctions       : [],
   runQueue          : [],  //Glitch in chrome that window.location has timing issues so it must be synchronized
   isRunningCommand  : false,
   domReady          : false,
   init: function() {
      //Do allow the init to happen if the object exists
      if(document.getElementById("USERSCRIPT_BRIDGE")){return;}
      
      //Add the passing function
      var pass = document.createElement("div");
      pass.style.visiblity = "hidden"; pass.id = "USERSCRIPT_BRIDGE";
      document.body.appendChild(pass);
      this.returnObj = pass;
     
      //Attach detecting function events to page
      this.addJS(function(){
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
               document.getElementById("USERSCRIPT_BRIDGE").setAttribute("return", value);
            } else {
               document.getElementById("USERSCRIPT_BRIDGE").removeAttribute("return");
            }
            document.dispatchEvent(bridge_evt1);
         }
         function runNextBridgeFunction() {
            document.dispatchEvent(bridge_evt3);
         }
         function convertArgumentsToBridgePass(obj) { 
            if(Object.prototype.toString.call(obj) != "[object Arguments]" && Object.prototype.toString.call(obj) != "[object Object]" || arguments.length == 0) {
               return null;
            }
            //Check each arguement and form a string to pass
            var returnStr = '';
            var currentObj = obj[0];
            if (currentObj != null) {
               if((typeof currentObj).toLowerCase() != "object") {
                  returnStr += currentObj;
               } else if (Object.prototype.toString.call( currentObj ) === '[object Array]') {
                  returnStr += currentObj.join("{|||}");
               } else {
                  return null;
               }
            } else {
               returnStr += "(|||)"; //<----symbol for null
            }
            for(var i=1; i<obj.length;i++) {
               returnStr += "[|||]";   //<---separate arguments
               currentObj = obj[i];
               if (currentObj != null) {
                  if((typeof currentObj).toLowerCase() != "object") {
                     returnStr += currentObj;
                  } else if (Object.prototype.toString.call( currentObj ) === '[object Array]') {
                     returnStr += currentObj.join("{|||}");
                  } else {
                     return null;
                  }
               }
               else {
                  returnStr += "(|||)"; //<----symbol for null
               }
            }
            return returnStr;
         }
      });
      
      //Attach event and define the callback
      function bridgeReturnSimpleValue() {  
         //Save and send the data
         if(BRIDGE.callback) {
            var value = BRIDGE.returnObj.getAttribute("return");
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
            BRIDGE.callback(value);
            BRIDGE.callback = null;
         }
      }
      function handleGMFunction() {
         //Pass arguments into the new function
         var args = BRIDGE.returnObj.getAttribute("pass");
         if (args != null) {
            args = args.split("[|||]");
            BRIDGE.returnObj.removeAttribute("pass");
            var tempArgs = [];
            //Parse arguments if null exists
            for(var i=0;i<args.length;i++) {
               if (args[i] == "(|||)") {  //<---if null exists
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
         var value = BRIDGE.returnObj.getAttribute("run");
         BRIDGE.returnObj.removeAttribute("run");
         //Run the function here
         var returnVal = BRIDGE.GMFunctions[value].apply(this,args);
         if (returnVal != null) {
            BRIDGE.returnObj.setAttribute("return", returnVal);
         } else {
            BRIDGE.returnObj.removeAttribute("return");
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
         var bridge = document.getElementById("USERSCRIPT_BRIDGE");
         if(args != null) {
            bridge.setAttribute("pass", args);
         }
         bridge.setAttribute("run", function_name);
         document.dispatchEvent(bridge_evt2);
         var value = bridge.getAttribute("return");
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
      }, {function_name: name});
      
   },
   //Unregisters a userscript function
   unregisterFunction : function(name) {
      if(this.GMFunctions.hasOwnProperty(name)) {
         this.GMFunctions[name] = null;
         
         //Nulls the function on the page
         this.appendScript(name + " = null;");
         return true;
      }
      return false;
   },
   //Adds a function to the page
   addFunction : function(name, function_code, arguments) {  
      if (function_code == null){ function_code = function(){}; }
      //Add the function with the name and function
      function_code = this.handleArguments(function_code, arguments);
      
      if(function_code == null || name == null) {return;}
      var code = (function_code+"").replace("function", "function " + name);
      this.appendScript(code);
   },
   //Adds some javascript to the page
   addJS : function( code, arguments ) {
      if(code == null) {return;}
      //Check to see if its a function then remove the function part and the last }
      if(typeof(code) == "function") {  
         code = this.handleArguments(code, arguments);
         
         //Strips the function(){} wrapper
         code =  (code+"").replace(/\n/g, "");    //Convert to string
         code = code.replace(/^[^{]*?{/, "");
         code = code.substring(0, code.lastIndexOf("}"));
         this.appendScript(code);
      }
   },
   //Simulate a click
   click : function ( obj ) {
      if(obj == null){return false;}
      var evt = document.createEvent("HTMLEvents"); 
      evt.initEvent("click", true, true);
      obj.dispatchEvent(evt);
   },
   //Get a variable from the namespace of the page, asynchonized
   read : function ( _global_var, _callback, _arguments ) {
      this.run("function(){throwBridgeEvent(" + _global_var + ");}", _callback, _arguments);
   },
   //Execute code on the webpage
   run : function( _function_code, _callback, _arguments ) {
      _function_code = this.handleArguments(_function_code, _arguments);
      if(_function_code == null) {return;}

      //escape() is a workaround so that code is not interpreted incorrectly
      if(_callback != null && typeof(_callback) == "function"){
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
         BRIDGE.isRunningCommand = false;
      }
      //Run something in the queue
      if(BRIDGE.runQueue.length > 0) {
         if (!BRIDGE.isRunningCommand) {
            BRIDGE.isRunningCommand = true;
            var item = BRIDGE.runQueue.shift();
            
            var callback   = item.callback;
            var command    = item.command;
            
            //Set the last callback and run
            BRIDGE.callback = callback;
            location.href = ("javascript:" + command);
            item = null;
         }
      } else {
         //Finished
         BRIDGE.isRunningCommand = false;
      }
   },
   appendScript : function(_code) {
      var script = document.createElement("script");
      script.innerHTML = _code;
      this.returnObj.appendChild(script)
   },
   handleArguments : function(_code, _arguments, _escapeArguments) {
      if(_code       == null) {return null;}
      if(_arguments  == null) {return _code;}
      
      //Loop through each and place the initial varibles
      var initVar = "";
      for(var variable in _arguments) {
         var value = _arguments[variable];
         if(this.isArray(value)){
            if(_escapeArguments) {
               value = "('" + escape(value.join("|||")) + "').split('%7C%7C%7C')";     //each '%7C' is '|'
            } else {
               value = "('" + value.join("|||") + "').split('|||')";     //each '%7C' is '|'
            }
         } else if (typeof(value) == "string" || typeof(value) == "object") {
            if(_escapeArguments) {
               value = "'" + escape(value) + "'";
            } else {
               value = "'" + value + "'";
            }
         }
         initVar += "var " + variable + " = " + value + ";";
      }
      return (_code + "").replace(/^[^{]*?{/, "function(){" + initVar);
   },
   isArray : function(arr) {
      return Object.prototype.toString.call( arr ) === '[object Array]';
   },
};
BRIDGE.init();

