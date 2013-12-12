if (typeof isArray === "undefined") {
    window.isArray = function(o) {
        return Object.prototype.toString.call( o ) === '[object Array]';
    }
}
if (typeof isObject === "undefined") {
    window.isObject = function(o) {
        return Object.prototype.toString.call( o ) === '[object Object]';
    }
}
if (typeof isString === "undefined") {
    window.isString = function(o) {
        return Object.prototype.toString.call( o ) === '[object String]';
    }
}
if (typeof isFunction === "undefined") {
    window.isFunction = function(o) {
        return o && Object.prototype.toString.call( o ) === '[object Function]';
    }
}

/*==================================*\
              Prototype
\*==================================*/
(function(object){
function implement(Class, implementationObj) {
    for (var i in implementationObj) {
        if (implementationObj.hasOwnProperty(i)) {
            Class.prototype[i] = implementationObj[i];
        }
    }
}

// String
implement(String, {
    between: function(begin, end, index) {
        index = index || 0;
        var sIndex = this.indexOf(begin, index);
        if (sIndex == -1) return null;
        sIndex += begin.length;
        var eIndex = this.indexOf(end, sIndex);
        if (eIndex == -1) return null;
        return this.substring(sIndex, eIndex);
    },
    capitalize: function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    },
    contains: function(s) {
        return this.indexOf(s)!=0;
    },
    endsWith: function(s) {
        if (this.length < s.length) return false;
        return this.substr(this.length - s.length) === s;
    },
    escapeHTML: function() {
        return String(this).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },
    isEmail: function() {
        var r = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return r.test(this);
    },
    isEmpty: function() {
        return this == "";
    },
    isUrl: function() {
        var http = "http://";
        return this.substring(0, http.length) === http;
    },
    removeExtension: function() {
        if (this.length > 4 && this[this.length - 4] == '.') {
            return this.substring(0, this.lastIndexOf('.'));
        }
        return this + "";
    },
    removeWords: function(listOfWords) {
        if (isArray(listOfWords) || listOfWords.empty()) {
            return this;
        }
        var regexStr = "(^|\\W)("+listOfWords[0];
        for(var i=1;i<listOfWords.length;i++) {
            regexStr += "|" + listOfWords[i];
        }
        regexStr += ")(\\W|$)";
        return this.replace(new RegExp(regexStr,"gi"), "");
    },
    setCharAt: function(index, character) {
        if (index < 0) {index = this.length + index;}
        return this.substr(0, index) + character + this.substr(index+character.length);
    },
    startsWith: function(s) {
        if (!s || s.length == 0 || s.length > this.length) {return false;}
        return this.substring(0, s.length) == s;
    },
    underscorize: function() {  
        return this.replace(/\s|-/g, "_");
    },
    upTo: function(string, index, dontInclude) {
        var i = this.indexOf(string, index);
        index = index || 0;
        if (!i) {return null;}
        return this.substring(index, i) + (!dontInclude ? string : "");
    },
});

// Array
implement(Array, {
    contains: function(v) {
        return this.indexOf(v)>=0;
    },
    hasOneOf: function(arr) {
        if (!arr || isArray(arr)) return;
        for (var i = 0; i < arr.length; i++) {
            if (this.indexOf(i) !== -1) {
                return true;
            }
        }
        return false;
    },
    clone: function() {
        return this.concat([]);
    },
    each: function(fn) {
        if(!fn || !isFunction(fn)) return;
        for (var i=0; i<this.length;i++) 
            fn(i, this[i]); 
    },
    empty: function() {
        return this.length === 0;
    },
    last: function() {
        if (!this.length) {return null;}
        return this[this.length-1];
    },
    rEach: function(fn) {
        if(!fn || !isFunction(fn)) return;
        for (var i=this.length-1;i>=0;--i) 
            fn(i, this[i]); 
    },
});
})();





