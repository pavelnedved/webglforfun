var Shader = {
//init shader file
//
    getShader : function(gl, id) {
        var script = document.getElementById(id);
        var shader;
        var str = "";
        var fs = script.firstChild;
        if (script.type == "x-shader/x-fragment") {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        } else if (script.type == "x-shader/x-vertex") {
            shader = gl.createShader(gl.VERTEX_SHADER);
        }
        while (fs) {
            if (fs.nodeType == 3) {
                str += fs.textContent;
            }
            fs = fs.nextSibling;
        }
        gl.shaderSource(shader, str);
        gl.compileShader(shader);
        return shader;
    },
    
    load : function() {
        var fragmentShader= Shader.getShader(gl, "shader-fs");
        var vertexShader= Shader.getShader(gl, "shader-vs");
        prg = gl.createProgram();
        gl.attachShader(prg, vertexShader);
        gl.attachShader(prg, fragmentShader);
        gl.linkProgram(prg);
        gl.useProgram(prg);
        prg.aVertexPosition  = gl.getAttribLocation(prg, "aVertexPosition");
        prg.aVertexNormal    = gl.getAttribLocation(prg, "aVertexNormal");
        prg.aVertexColor     = gl.getAttribLocation(prg, "aVertexColor");
        prg.uPMatrix         = gl.getUniformLocation(prg, "uPMatrix");
        prg.uMVMatrix        = gl.getUniformLocation(prg, 'uMVMatrix');
        prg.uNMatrix           = gl.getUniformLocation(prg, "uNMatrix");
        prg.uCubeSampler = gl.getUniformLocation(prg, "uCubeSampler");
        prg.uMaterialAmbient   = gl.getUniformLocation(prg, "uMaterialAmbient"); 
        prg.uShininess          = gl.getUniformLocation(prg, "uShininess");
        prg.uLightAmbient      = gl.getUniformLocation(prg, "uLightAmbient");   
        gl.uniform4fv(prg.uLightAmbient, [0.7,0.7,0.7,1.0]);
        gl.uniform4fv(prg.uLightDiffuse,  [1.0,1.0,1.0,1.0]); 
        gl.uniform4fv(prg.uMaterialAmbient, [1.0,1.0,1.0,1.0]); 
        gl.uniform1f(prg.uShininess, 10.0);
    }
}