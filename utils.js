if (typeof get === "undefined") {
window.get = function(url, callback) {
    callback = callback || function(){};
    function onload(response) {
        if (response && response.status === 200) {
            callback(response.responseText);
        } else {	
            callback(null);
        }
    }
    if (typeof GM_xmlhttpRequest !== "undefined") {
        // Cross domain
        GM_xmlhttpRequest({
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