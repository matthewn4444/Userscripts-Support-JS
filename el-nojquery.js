/* Useful functions when not using jQuery
 *  
 *  byId(id, [parent])
 *      Exactly the same as document.getElementById()
 *      @param: id is the string to get the id on the page
 *      @param: optional parent node to search from
 *      @return: the element
 *
 *  byClass(className, [parent])
 *      Exactly the same as document.getElementsByClassName()
 *      @param: the class you are searching for
 *      @parent: optional parent node to search from
 *      @return: the elements of that class
 *
 *  byTag(tag, [parent])
 *      Exactly the same as document.getElementsByTagName()
 *      @param: the tag name you are searching for
 *      @parent: optional parent node to search from
 *      @return: the elements of that tag
 *
 *  createEl(elementName, [attributesObject], [attachToParent])
 *      Creates the element, attaches and id and attributes and appends it to 
 *      the parent
 *      @param: the element name you want to make
 *      @param: attributes in an object
 *      @param: parent to attach element to
 *      @return: returns the element
 *
 *  createText(text, [parent])
 *      Exactly the same as document.createTextNode()
 *      @param: text is the string of text to return
 *      @param: optional parent to attach text toString
 *      @return: returns a textnode        
 *  
 *  insertBefore(element, elementToPlaceBefore)
 *      Exactly the same as parent.insertBefore(element, elementToPlaceBefore)
 *      @param: the element to place
 *      @param: places the element in front of this element
 *      @return: the element
 *
 *  ajaxJsonGet(url, successFn, errorFn)
 *      Exactly the same as $.get for jQuery
 *      @param: the url to get
 *      @param: the function callback (with data as an argument)
 *      @param: the error function when fails
 *
 *  isArray(array)
 *      Sees if this is an array
 *      @param: any object
 *      @return: true if it is an array
 *
 *  isObject(object)
 *      Sees if this is an object
 *      @param: any object
 *      @return: true if it is an object
 *
 *  isString(string)
 *      Sees if this is an string
 *      @param: any object
 *      @return: true if it is an string
 *
 *  isNumber(number)
 *      Sees if this is an number
 *      @param: any object
 *      @return: true if it is an number
 *
 *  isFunction(function)
 *      Sees if this is an function
 *      @param: any object
 *      @return: true if it is an function
 *
 */

function isArray(a) {
    return Object.prototype.toString.call(a) === '[object Array]';
}
function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
}
function isString(s) {
    return Object.prototype.toString.call(s) === '[object String]';
}
function isNumber(n) {
    return Object.prototype.toString.call(n) === '[object Number]';
}
function isFunction(f) {
    return Object.prototype.toString.call(f) === '[object Function]';
}
function byId(id, parent/*optional*/) {
    if (!parent) parent = document;
    return parent.getElementById(id);
}
function byClass(className, parent/*optional*/) {
    if (!parent) parent = document;
    return parent.getElementsByClassName(className);
}
function byTag(tag, parent/*optional*/) {
    if (!parent) parent = document;
    return parent.getElementsByTagName(tag);
}
function createEl(elementName, arg1 /*optional*/, arg2 /*optional*/) {
    var attrs, parent;
    switch(arguments.length) {
        case 1:
            parent = attrs = null;
            break;
        case 2:
            if (isObject(arg1)) attrs=arg1;
            parent = null;
            break;
        case 3:
            if (isObject(arg1)) attrs=arg1;
            if (arg2) parent=arg2;
            break;
        default:
            return null;
    }
    var el = document.createElement(elementName);
    if(attrs) for (var a in attrs) el.setAttribute(a, attrs[a]);
    if (parent) parent.appendChild(el);
    return el;
}
function createText(txt, parent) {
    var n = document.createTextNode(txt);
    if (parent) parent.appendChild(n);
    return n;
}
function insertBefore(el, elAfter) {
    if (el && elAfter && elAfter.parentNode) elAfter.parentNode.insertBefore(el, elAfter);
    return el;
}
function ajaxJsonGet(url, callBack, error) {
    if (!error) error = function(){};
    var httpRequest;
    if (window.XMLHttpRequest) { // Mozilla, Safari, ...
        httpRequest = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // IE 8 and older
        httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
    }
    httpRequest.onreadystatechange = function(){
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200) {
                var response = JSON.parse(httpRequest.responseText);
                if (callBack) callBack(response);
            } else {
                error();
            }
        }
    };
    httpRequest.open('GET', url, true);
    httpRequest.send(null);
}