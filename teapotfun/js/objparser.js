/*
Parts of this file is a rewrite from https://github.com/mauricelam/Teapot/blob/master/objparser.js

which contains a objparser and a normal computation function 
but the normal function is not used here.
*/

/**
 * Parser for .obj files
 */

var objParser = {
    reset: function () {
        this.vertices = [];
        this.faces = [];
    },
    'v': function (x, y, z) { // vertex
        this.vertices.push(+x, +y, +z); // cast to number type
    },
    'f': function (v1, v2, v3) { // face
        v1 = v1.split('/')[0]; // only care about the vertex
        v2 = v2.split('/')[0];
        v3 = v3.split('/')[0];
        this.faces.push(+v1 - 1, +v2 - 1, +v3 - 1); // also convert 1-based indices to 0-based
    }, 
};

/**
 * Call this function to load a .obj file from a URL and then parse it into an object
 * 
 * @returns { vertices: <array of vertex coords>, faces: <array of vertex indices> }
 */
function loadObjFile (url) {
    var objString = loadTextFile(url);
    var lines = objString.split('\n');
    objParser.reset();

    lines.forEach(function (line) {
        if (line.length === 0) { return; }
        var components = line.split(/ +/);
        var type = components[0];
        try {
            objParser[type].apply(objParser, components.slice(1));
        } catch (e) {
            console.warn('Unknown obj command type: "' + type + '"', e.toString());
        }
    });

    return { vertices: objParser.vertices, indices: objParser.faces };
}

/**
 * Load a text file synchronously through XMLHttpRequest.
 */
function loadTextFile(url) {
    var request = new XMLHttpRequest();
    //var obj =readTextFile("file:///C:/your/path/to/file.txt");
    request.open('GET', url, false);
    request.send();
    return request.responseText;
}
