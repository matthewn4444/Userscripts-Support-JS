if (typeof get === "undefined") {
window.get = function(url, callback) {
    callback = callback || function(){};
    function onload(response) {
        if (response && (response.status === 200 || response.responseText != null)) {
            callback(response.responseText);
        } else {	
            callback(null);
        }
    }
    var gmXMLRequest = typeof GM.xmlHttpRequest !== "undefined"
        ? GM.xmlHttpRequest : GM_xmlhttpRequest;
    if (typeof gmXMLRequest !== "undefined") {
        // Cross domain
        gmXMLRequest({
            method:"GET",
            url: url,
            overrideMimeType: 'text/plain; charset=x-user-defined',
            onload: onload
        });
    } else {
        var req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.overrideMimeType('text/plain; charset=x-user-defined');
        req.onload = function(e) {
            if (e) {
                onload(e.target);
            } else {
                callback();
            }
        }
        req.send();
    }
}
}