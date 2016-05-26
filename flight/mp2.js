var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

// Create a place to store terrain geometry
var tVertexPositionBuffer;

//Create a place to store normals for shading
var tVertexNormalBuffer;

// Create a place to store the terrain triangles
var tIndexTriBuffer;

//Create a place to store the traingle edges
var tIndexEdgeBuffer;

// View parameters
var eyePt = vec3.fromValues(0.0,0.0,0.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var upview = vec3.fromValues(0.0,1.0,0.0);
var viewPt = vec3.fromValues(0.0,0.0,0.0);

// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();
var vPositions = new Array(3);
//Create Projection matrix
var pMatrix = mat4.create();
var key = {};
var mvMatrixStack = [];

var minX = -10.0;
var maxX = 10.0;
var minY = -10.0;
var maxY = 10.0;
var maxZ = 60;
var height = 2;
var width = 2;
// you can change roughness to make more extream
var roughness = 0.8;
//this must be a power of 2 and 7 is good enough, things under 7 like 6, 5, 4 is also good
//but the view has to be changed
//but after 8 the loading gets slow,and it looks like a garden for some reason, so for the sake of speed i choose 6
var gridN = 128; 
var speed = 0.004;
var eyeRotation = quat.create();
var heightBuffer;

//-------------------------------------------------------------------------
function drawTerrainEdges(){
    for(var i = 0; i < width; ++i){
        for(var j = 0; j < height; ++j){
            gl.polygonOffset(1,1);
            gl.bindBuffer(gl.ARRAY_BUFFER, vPositions[i][j]);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vPositions[i][j].itemSize,
                gl.FLOAT, false, 0, 0);

            // Bind normal buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, tVertexNormalBuffer.itemSize,
                gl.FLOAT, false, 0, 0);

            //Draw
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
            gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);
        }
    }

}
// same as the draw terrain in the example given
function drawTerrain(){
    for(var i = 0; i < width; ++i){
        for(var j = 0; j < height; ++j){
            gl.polygonOffset(0,0);
            gl.bindBuffer(gl.ARRAY_BUFFER, vPositions[i][j]);
            gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, vPositions[i][j].itemSize,
                gl.FLOAT, false, 0, 0);

            // Bind normal buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
            gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, tVertexNormalBuffer.itemSize,
                gl.FLOAT, false, 0, 0);

            //Draw
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
            gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);
        }
    }

}
//---------------------------------------------------------------------
function uploadModelViewMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//---------------------------------------------------------------------
function uploadProjectionMatrixToShader() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform,
        false, pMatrix);
}

//---------------------------------------------------------------------
function uploadNormalMatrixToShader() {
    mat3.fromMat4(nMatrix,mvMatrix);
    mat3.transpose(nMatrix,nMatrix);
    mat3.invert(nMatrix,nMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}


function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
        throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//------------------------------------------------------------------------------
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//------------------------------------------------------------------------------
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

//------------------------------------------------------------------------------
function createGLContext(canvas) {
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for (var i=0; i < names.length; i++) {
        try {
            context = canvas.getContext(names[i]);
        } catch(e) {}
        if (context) {
            break;
        }
    }
    if (context) {
        context.viewportWidth = canvas.width;
        context.viewportHeight = canvas.height;
    } else {
        alert("Failed to create WebGL context!");
    }
    return context;
}

//------------------------------------------------------------------------------
function loadShaderFromDOM(id) {
    var shaderScript = document.getElementById(id);

    // If we don't find an element with the specified id
    // we do an early exit
    if (!shaderScript) {
        return null;
    }

    // Loop through the children for the found DOM element and
    // build up the shader source code as a string
    var shaderSource = "";
    var currentChild = shaderScript.firstChild;
    while (currentChild) {
        if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
            shaderSource += currentChild.textContent;
        }
        currentChild = currentChild.nextSibling;
    }

    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

//------------------------------------------------------------------------------
function setupShaders() {
    vertexShader = loadShaderFromDOM("shader-vs");
    fragmentShader = loadShaderFromDOM("shader-fs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Failed to setup shaders");
    }

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
    shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");
    shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");
    shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
    shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
    shaderProgram.uniformBlinnLoc = gl.getUniformLocation(shaderProgram, "uBlinn");
}


//---------------------------------------------------------------------
function uploadLightsToShader(loc,a,d,s) {
    gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
    gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
    gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
    gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
    gl.uniform1f(shaderProgram.uniformBlinnLoc, 1.0);
}

//------------------------------------------------------------------------------
function setupBuffers() {
    heightBuffer = diamondSquare(roughness);

    var minh = Number.MAX_VALUE;
    var maxh = Number.MIN_VALUE;
    for(var i = 0; i < heightBuffer.length; ++i){
        maxh = Math.max(maxh, heightBuffer[i]);
        minh = Math.min(minh, heightBuffer[i]);
    }
    var minZ = maxZ - (maxh - minh);
    for(var i = 0; i < heightBuffer.length; ++i){
        heightBuffer[i] = minZ + (heightBuffer[i] - minh) * (maxZ - minZ) / (maxh - minh);
    }
    minh = Number.MAX_VALUE;
    maxh = Number.MIN_VALUE;
    for(var i = 0; i < heightBuffer.length; ++i){
        maxh = Math.max(maxh, heightBuffer[i]);
        minh = Math.min(minh, heightBuffer[i]);
    }
    for(var i = 0; i < width; ++i){
        vPositions[i] = new Array(3);
        for(var j = 0; j < height; ++j){
            var vTerrain=[];
            var startX = minX + i*(maxX - minX) / width;
            var endX = minX + (i+1)*(maxX - minX) / width;
            var startY = minY + j*(maxY - minY) / height;
            var endY = minY + (j+1)*(maxY - minY) / height;
            if(i % 2)
                xflip=0;
            else 
                xflip=1;
            if(j % 2)
                yflip=0;
            else 
                yflip=1;
            pushtoBuffer(gridN, heightBuffer, startX, endX, startY, endY, vTerrain, xflip, yflip);
            vPositions[i][j] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vPositions[i][j]);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
            vPositions[i][j].itemSize = 3;
            vPositions[i][j].numItems = (gridN+1)*(gridN+1);
        }
    }

    var fTerrain=[];
    var nTerrain=[];
    var eTerrain=[];

    var numT = terrainFromIteration(gridN, fTerrain, nTerrain);
    // Specify normals to be able to do lighting calculations
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain), gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);

    // Specify faces of the terrain
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain), gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3;

    //Setup Edges
    generateLinesFromIndexedTriangles(fTerrain,eTerrain);
    tIndexEdgeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain), gl.STATIC_DRAW);
    tIndexEdgeBuffer.itemSize = 1;
    tIndexEdgeBuffer.numItems = eTerrain.length;
}

//function to change up and down of the view
function updatePitchMatrix(amount) {
    var leftVec = vec3.create();
    vec3.cross(leftVec, upview, viewDir);
    vec3.normalize(leftVec, leftVec);
    vec3.transformQuat(leftVec, leftVec, eyeRotation);
    var workingQuat = quat.create();
    quat.setAxisAngle(workingQuat, leftVec, degToRad(amount));
    quat.multiply(eyeRotation, workingQuat, eyeRotation);
    quat.normalize(eyeRotation, eyeRotation);
}
//function to change roll left or right
function updateRollMatrix(amount) {
    var viewVec = vec3.clone(viewDir);
    vec3.normalize(viewVec, viewVec);
    vec3.transformQuat(viewVec, viewVec, eyeRotation);
    var q = quat.create();
    quat.setAxisAngle(q, viewVec, degToRad(amount));
    quat.multiply(eyeRotation, q, eyeRotation);
    quat.normalize(eyeRotation, eyeRotation);

}
// function to change Yaw
function updateYawMatrix(amount) {
    var upVec = vec3.clone(upview);
    //vec3.normalize(upVec, upVec);
    vec3.transformQuat(upVec, upVec, eyeRotation);
    var q = quat.create();
    quat.setAxisAngle(q, upVec, degToRad(amount));
    quat.multiply(eyeRotation, q, eyeRotation);
    quat.normalize(eyeRotation, eyeRotation);

}

// draw function here using perspective 
function draw() {
    var transformVec = vec3.create();

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //change the prespective height to 500
    mat4.perspective(pMatrix,degToRad(90), gl.viewportWidth / gl.viewportHeight, 0.9, 10000.0);

    var rotViewDir = vec3.clone(viewDir);
    vec3.transformQuat(rotViewDir, rotViewDir, eyeRotation);
    vec3.normalize(rotViewDir, rotViewDir);
    var rotUp = vec3.clone(upview);
    vec3.transformQuat(rotUp, rotUp, eyeRotation);
    vec3.normalize(upview, upview);
    vec3.add(viewPt, eyePt, rotViewDir);
    mat4.lookAt(mvMatrix,eyePt,viewPt,rotUp);
    mvPushMatrix();
    vec3.set(transformVec,0.0,-0.5,-5);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(25));
    //call functions to draw terrain
    setMatrixUniforms();
    if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked))
    {
        uploadLightsToShader([0,1,1],[0.0,0.0,0.0],[0.0,0.7,0.8],[0.0,0.0,0.0]);
        drawTerrain();
    }

    if(document.getElementById("wirepoly").checked){
        uploadLightsToShader([0,1,1],[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
        drawTerrainEdges();
    }

    if(document.getElementById("wireframe").checked){
        uploadLightsToShader([0,1,1],[1.0,1.0,1.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
        drawTerrainEdges();
    }
    mvPopMatrix();

}

//key press function
function keyPress() {
    if( key[37]) {
    // w view up
        updateRollMatrix(-1);
    }

    if( key[39]) {
    //s view down
        updateRollMatrix(1);
    }

    if(key[38]) {
    // A rotate left
        updatePitchMatrix(-1);
    }

    if(key[40]) {
    // D rotate right 
        updatePitchMatrix(1);
    }

    if(key[65]) {
    // left rotate left 
        updateYawMatrix(1);
    }
    if(key[68]) {
        // right rotate right 
        updateYawMatrix(-1);
    }
    if (key[87]) {
    //  up go forward
        speed = 0.05;
    } else if (key[83]) {
     //  down go backward   
        speed = -0.04;
    }else  {
        //normal speed go forward as required
        speed = 0.003;
    }
}


//animate function ,add scale to move 
function animate() {
    var viewVec = vec3.clone(viewDir);
    vec3.normalize(viewVec, viewVec);
    vec3.transformQuat(viewVec, viewVec, eyeRotation);
    var move = vec3.create();
    vec3.scale(move, viewVec, speed);
    vec3.add(eyePt, eyePt, move);
}

//start up function two handlers to handle key press
function startup() {
    function downHandler(event) {
    key[event.keyCode] = true;
    }
    function upHandler(event) {
    key[event.keyCode] = false;
    }
    canvas = document.getElementById("myGLCanvas");
    gl = createGLContext(canvas);
    setupShaders();
    setupBuffers();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    document.onkeydown = downHandler;
    document.onkeyup = upHandler;
    tick();
}

// keypress function to handle key press you can press asdw and up down left right eight keys
function tick() {
    requestAnimFrame(tick);
    keyPress();
    draw();
    animate();
}

