/*==================================*\
          Simple HTML Parser
\*==================================*/
/*
 *  This allows you to parse a webpage without rendering it in the dom. The 
 *  parsing is relatively simple as it does not account for many factors (such
 *  as nested HTML tags etc). This is a very simple implementation of parsing
 *  HTML using text manipulation and should save lines of code when getting
 *  HTML from a URL and then trying to grab a URL from that page.
 *
 *  Constructor:
 *      var parser = SimpleHtmlParser(html, position);
 *          html:       [string|optional] this specifies what HTML we are parsing
 *          position:   [integer|optional] this specifies the starting position to parse
 *
 *  Static members
 *      //  Gets the HTML from url and runs the callback passing an instance of SimpleHtmlParser
 *      //      as a parameter with the HTML passed in the constructor
 *      //      For cross-browser support, you need to include GM_xmlhttpRequest
 *      SimpleHtmlParser.get(url, callback);
 *          url:        [string] the location of the HTML you want to parse
 *          callback:   [function] a callback that will receive SimpleHtmlParser instance
 *          Returns:    nothing
 *
 *  Member Functions
 *      //  Sees if the parser went to the end  
 *      //      the position would be -1
 *      isEndOfContent()
 *          Returns:    [boolean] true if position is -1
 *
 *      //  Moves the position after searched text (or an array of)
 *      skipText(textArray)
 *          textArray:  [array|string] the list of text to skip, order matters
 *          Returns:    [SimpleHtmlParser] self instance
 *  
 *      // Moves the position after searched text
 *      containsTextThenSkip(text)
 *          text:       [string] the text you want to skip
 *          Returns:    [boolean] if text is found or not
 *  
 *      // Passes the tag in HTML.
 *      skipTag(tag)
 *          tag:        [string] the tag you want to skip
 *          Returns:    nothing
 *          Throws:     throws when end of the HTML
 *  
 *      // Gets the text in the next element of the inputted tag
 *      getTextInNextTag(tag)
 *          tag:        [string] the next tag you want to get text from
 *          Returns:    nothing
 *          Throws:     throws when end of the HTML
 *  
 *      // Finds the text inside the current tag HTML
 *      //   This is not smart so it just finds the first closing tag and gives the inside text
 *      getTextInCurrentTag()    
 *          return      [string] the text inside the tag html element
 *  
 *      // Gets the item in the attribute of the current element
 *      getAttributeInCurrentTag(attribute)
 *          attribute:  [string] the attribute that has the value you want
 *          Returns:    [string] the value of the attribute, null if it doesnt exist
 */
function SimpleHtmlParser(html, pos) {
    this.position = pos ? pos : 0;
    this.html = html ? html : "";
}
SimpleHtmlParser.prototype = {
    // Private functions
    __private: {
        /**
         * Recursively crawls an element's children and receives its text. Not smart enough for
         * major parsing but simple for Jobmine tables.
         * @param text
         * @param tag
         * @param pos
         * @return text in the child node
         */
        getTextInNextTag: function(text, tag, pos) {
            var result = this.__private.htmlInTag.call(this, text, tag, pos);
            if (result == null) throw new Error("Cannot find " + tag + " in html.");
            var holdPosition = result.position;
            text = result.text;

            if (text.charAt(0) == '<') {
                tag = findCurrentTag(text, 0);
                text = this.__private.getTextInNextTag.call(this, text, tag, 0);
                this.position = holdPosition;
                return text;
            }

            text = text.replace(/&nbsp;/gim, "").trim();
            this.position = holdPosition;
            return text;
        },
        /**
         * Recursively crawls an element's children and receives its text. Not smart enough for
         * major parsing but simple for Jobmine tables.
         * @param text
         * @param tag
         * @param pos
         * @return text in the child node
         */
        findCurrentTag: function(text, pos) {
            var lessThan = text.lastIndexOf("<", pos);
            if (lessThan == -1 || text.length <= lessThan + 1) throw new Error("Cannot find last tag in html.");

            // If captured the ending tag then skip the slash but find the tag name
            if (text.charAt(lessThan+1) == '/') {
                lessThan++;
            }
            var result = this.__private.indexOfFirstOccurance(text, lessThan, [" ", ">"]);
            if (!result) throw new Error("Cannot find last tag in html.");
            return text.substring(lessThan + 1, result.position);
        },
        /**
         * Finds the text of the tag you are looking for in the HTML. Will return the updated
         * position to end of the element. If cannot find, it will return null.
         * @param html
         * @param tag
         * @param position
         * @return Pair (of positon and text), if not found will return null
         */
        htmlInTag: function(text, tag, pos) {
            // Get the text inside the column
            var open = "<" + tag, closing = "</" + tag + ">";
            var start = text.indexOf(open, pos);
            if (start == -1) { return null; }
            start = text.indexOf(">", start);
            if (start == -1) { return null; }
            var end = text.indexOf(closing, start);
            if (end == -1) { return null; }
            text = text.substring(++start, end);
            end += closing.length;
            return {position: end, text: text};
        },
        /**
         * This internal function will find the first occurance of one of the specfied strings
         * passed in.
         * For example, if you pass         indexOfFirstOccurance(text, position, ["foo", "bar", "thing"]);
         * it will look in the text for each and return the position and string that appears first
         *
         * For a sentence like    "I am Matthew and I like foo and bar with thing"
         * The first occurance would be "foo" at index 21
         * @param text This is the string to search
         * @param indexFrom Like indexOf, this index is where searching starts from
         * @param stringsArr A list of words to search
         * @return a pair of the position and found text, null if cannot find any
         */
        indexOfFirstOccurance: function(text, indexFrom, stringsArr) {
            var positions = new Array(stringsArr.length);
            var smallest = text.length;
            var smallestIndex = -1;
            for (var i = 0; i < stringsArr.length; i++) {
                positions[i] = text.indexOf(stringsArr[i], indexFrom);
                
                // Record the index if this came first
                if (positions[i] < smallest && positions[i] >= 0) {
                    smallestIndex = i;
                    smallest = positions[i];
                }
            }
            
            // Could not find any of the strings in the text
            if (positions[smallestIndex] == -1) {
                return null;
            }
            return {position: positions[smallestIndex], text: stringsArr[smallestIndex]};
        },
        get: function(url, callback) {
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
                    overrideMimeType: 'text/plain; charset=utf-8',
                    onload: onload
                });
            } else {
                var req = new XMLHttpRequest();
                req.open("GET", url, true);
                req.overrideMimeType('text/plain; charset=utf-8');
                req.onload = function(e) {
                    if (e) {
                        onload(e.target);
                    } else {
                        callback();
                    }
                }
                req.send();
            }
            return this;
        },
    },
    isEndOfContent: function() {
        return this.position == -1;
    },
    containsTextThenSkip: function(text) {
        var index, i;
        index = this.html.indexOf(text, this.position);
        if (index == -1) return false;
        this.position = index + text.length;
        return true;
    },
    skipText: function(arrOfText) {
        if (Object.prototype.toString.call(arrOfText) !== '[object Array]') 
            arrOfText = [arrOfText + ""];
        var index, i, text;
        for (i = 0; i < arrOfText.length; i++) {
            text = arrOfText[i];
            index = this.html.indexOf(text, this.position);
            if (index == -1) throw new Error("Cannot find " + text + " in html.");
            this.position = index + text.length;
        }
        return this;
    },
    /**
     * Passes the HTML, the tag you are looking for and the position, will skip that tag
     * and forward the position in the HTML. Will throw if end of HTML.
     * @param tag
     */
    skipTag: function(tag) {
       var open = "<" + tag, closing = "</" + tag + ">";
       this.position = this.html.indexOf(open, this.position);
       if (this.position == -1) throw new Error("Cannot skip tag because open " + tag + " doesnt exist.");
       this.position = this.html.indexOf(closing, this.position);
       if (this.position == -1) throw new Error("Cannot skip tag because closing " + tag + " doesnt exist.");
       this.position += closing.length;
       return this;
    },
    /**
     * Used to find the text inside the element (goes further down the children till reaches
     * text). This is not smart enough to pick up trailing text after embedded elements or
     * the same element in the element (such as a <div> inside another <div>).
     * @param tag
     * @return text
     */
    getTextInNextTag: function(tag) {
        return this.__private.getTextInNextTag.call(this, this.html, tag, this.position);
    },
    /**
     * Finds the text inside the current html tag
     * Like getTextInNextElement, it will recusively look for the text
     * inside the tag. The current tag is where the current position inside
     * the html the parser is using.
     * @return text inside the current element
     */
    getTextInCurrentTag: function() {
        var lessThan = this.html.lastIndexOf("<", this.position);
        if (lessThan == -1) throw new Error("Cannot find text in current element");
        this.position = lessThan;
        var tag = this.__private.findCurrentTag.call(this, this.html, this.position);
        return this.getTextInNextTag(tag);
    },
    /**
     * This finds the attribute's value inside the current element
     * @param attribute to find
     * @return the value inside the attribute or null if attribute doesnt exist
     */
    getAttributeInCurrentTag: function(attribute) {
        var lessThan = this.html.lastIndexOf("<", this.position);
        if (lessThan == -1) throw new Error("Cannot find attribute in current element");
        this.position = lessThan;

        // See if we are in the closing tag, go to the last opening tag of the same tag
        if (this.html.charAt(this.position + 1) == '/') {
            var tag = this.__private.findCurrentTag.call(this, this.html, this.position);
            this.position = this.html.lastIndexOf("<" + tag, this.position);
            if (this.position == -1) throw new Error("Cannot find attribute in current element");
        }

        // Find either the end of the tag or the attribute
        var result = this.__private.indexOfFirstOccurance.call(this, this.html, this.position, [attribute + "=", ">"]);
        if (!result) throw new Error("Cannot find attribute in current element.");
        if (result.text == ">") return null;
        var attrStart = result.position + result.text.length;

        // See what type of quotes it is using and find the other quote that surrounds the value
        var quoteChar = this.html.charAt(attrStart);
        if (quoteChar != '"' && quoteChar != '\'') {
            throw new Error("Cannot find attribute in current element. (Cannot parse attribute)");
        }
        attrStart++;
        var attrEnd = this.html.indexOf(quoteChar, attrStart);
        if (attrEnd == -1) {
            throw new Error("Cannot find attribute in current element. (Cannot parse attribute)");
        }
        return this.html.substring(attrStart, attrEnd);
    },
};
SimpleHtmlParser.get = function(url, callback) {
    if (url && callback) {
        SimpleHtmlParser.prototype.__private.get(url, function(response){
            callback.call(window, new SimpleHtmlParser(response));
        });
    }
}