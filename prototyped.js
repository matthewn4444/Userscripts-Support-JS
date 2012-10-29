/*==================================*\
               STRINGS
\*==================================*/
String.prototype.contains = function(s) {
    return this.indexOf(s)!=0;
}
String.prototype.empty = function() {
    return this=="";
}
String.prototype.capitalize = function(){
    return this.replace( /(^|\s)([a-z])/g , function(m,p1,p2){ return p1+p2.toUpperCase(); } );
};
String.prototype.escapeHTML = function(){
    return String(this).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
String.prototype.underscorize = function() {
   return this.replace(/\s|-/g, "_");
}
String.prototype.startsWith = function(str) {
   if (str == null || str.length == 0) {return false;}
   return this.substring(0, str.length) == str;
}
String.prototype.setCharAt = function(index, character) {
   if (index < 0) {index = this.length + index;}
   return this.substr(0, index) + character + this.substr(index+character.length);
}
String.prototype.removeWords = function(listOfWords){
   if (Object.prototype.toString.call(listOfWords) === '[object Array]' 
        || listOfWords.empty()) {
      return this;
   }
   var regexStr = "(^|\\W)("+listOfWords[0];
   for(var i=1;i<listOfWords.length;i++) {
      regexStr += "|" + listOfWords[i];
   }
   regexStr += ")(\\W|$)";
   return this.replace(new RegExp(regexStr,"gi"), "");
}
String.prototype.getTextBetween=function(front, end){
   if (this==null){return null;}
   var startIndex=0;
   var endIndex=this.length-1;
   if (front!=null){startIndex=this.indexOf(front)+front.length;}
   if (end!=null){endIndex=this.lastIndexOf(end);}
   return this.substring(startIndex,endIndex);
};

/*==================================*\
               ARRAYS
\*==================================*/
Array.prototype.foreach = function(fn) {
    if(fn) for (var i=0; i<this.length;i++) fn(this[i],i); else throw new Error("Array.prototype.foreach: no callback");
}
Array.prototype.reverseForeach = function(fn) {
    if(fn) for (var i=this.length-1;i>=0;--i) fn(this[i],i); else throw new Error("Array.prototype.reverseForeach: no callback");
}
Array.prototype.empty = function() {
    return this.length===0;
}
Array.prototype.contains = function(val) {
    return this.indexOf(val)>=0;
}
Array.prototype.clone = function(){
   return this.concat([]);
}
Array.prototype.last = function(index){
   if (this.empty()) {return null;}
   return this[this.length-1];
}