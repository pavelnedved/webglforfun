var gl = null;     // WebGL
var prg = null;    
var pMatrix = mat4.create();    
var mvMatrix = mat4.create();
var nMatrix =  mat4.create();      // The normal matrix
var c_width = 1024;
var c_height = 1024;
var faceTex = null;
var reflectTex = null;
var objects= [];
  function init(){
      gl.clearColor(1,0.3,0.3, 1.0);
      gl.clearDepth(100.0);
      gl.enable(gl.DEPTH_TEST);
      initTex();
      initCube();
      initTransforms();
  }

  function initTex(){
    //Init texture
    faceTex = gl.createTexture();
    var cover = new Image();
    cover.onload = function(){
    gl.bindTexture(gl.TEXTURE_2D, faceTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cover);
    gl.bindTexture(gl.TEXTURE_2D, null);
    }
    cover.src = 'img/cover.jpg';
    //cover img of teapot
  }

  function initCube(){
    function loadCubemapFace(gl, target, texture, pic) {
      var cubeImg = new Image();
      cubeImg.onload = function(){
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cubeImg);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
      }
      cubeImg.src = pic;
    };
    reflectTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, reflectTex);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_X, reflectTex, 'img/positive_x.jpg');
    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_X, reflectTex, 'img/negative_x.jpg');
    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Y, reflectTex, 'img/positive_y.jpg');
    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, reflectTex, 'img/negative_y.jpg');
    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_POSITIVE_Z, reflectTex, 'img/positive_z.jpg');
    loadCubemapFace(gl, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, reflectTex, 'img/negative_z.png');
  }
  function initTransforms(){   
      //Perspective matrix
      mat4.identity(pMatrix);
      mat4.perspective(50, c_width / c_height, 0.1, 1000.0, pMatrix);
      gl.uniformMatrix4fv(prg.uPMatrix, false, pMatrix);    //Maps the Perspective matrix to the uniform prg.uPMatrix

      mat4.identity(mvMatrix);
      gl.uniformMatrix4fv(prg.uMVMatrix, false, mvMatrix); 
  }
  function updateTransforms() {
      mat4.identity(mvMatrix);
      mat4.translate(mvMatrix, [0.0, -1.0, -10.0]);
      // Rotate about y axis
      mat4.rotateX(mvMatrix, elevation/100);

      // Rotate about z axis
      mat4.rotateY(mvMatrix, rotation/100);
//    normal matrix
      mat4.set(mvMatrix, nMatrix);
      mat4.inverse(nMatrix);
      mat4.transpose(nMatrix);

      gl.uniformMatrix4fv(prg.uMVMatrix, false, mvMatrix);
   }
  function load(){
      var alias='model';
      var object = loadObjFile("/teapot.obj");
      object.alias =alias;
      var vertexBufferObject = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferObject);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);
      //cal normals and apply  
      var normalBufferObject = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBufferObject);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(calNormal.calculateNormals(object.vertices, object.indices)), gl.STATIC_DRAW);
      var colorBufferObject;
      var indexBufferObject = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBufferObject);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(object.indices), gl.STATIC_DRAW);
      object.vbo = vertexBufferObject;
      object.ibo = indexBufferObject;
      object.nbo = normalBufferObject;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      gl.bindBuffer(gl.ARRAY_BUFFER,null);

      objects.push(object);
  }
  /**
  * Main rendering/draw function
  */
  function draw() {
      gl.viewport(0, 0, c_width, c_height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    
      updateTransforms();
      gl.uniformMatrix4fv(prg.uMVMatrix, false, mvMatrix);
      gl.uniformMatrix4fv(prg.uNMatrix, false, nMatrix);
      for (var i = 0; i < objects.length; i++){    
          var object = objects[i];
          if(object.alias == 'model') {
              gl.activeTexture(gl.TEXTURE0);
              gl.bindTexture(gl.TEXTURE_2D, faceTex);
              gl.uniform1i(prg.uSampler, 0);

              gl.activeTexture(gl.TEXTURE1);
              gl.bindTexture(gl.TEXTURE_CUBE_MAP, reflectTex);
              gl.uniform1i(prg.uCubeSampler, 1);
              gl.uniformMatrix4fv(prg.uMVMatrix, false, mvMatrix);
              gl.uniformMatrix4fv(prg.uNMatrix, false, nMatrix);
          } 
          gl.enableVertexAttribArray(prg.aVertexPosition);    
          gl.bindBuffer(gl.ARRAY_BUFFER, object.vbo);
          gl.vertexAttribPointer(prg.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(prg.aVertexNormal);
          gl.bindBuffer(gl.ARRAY_BUFFER, object.nbo);
          gl.vertexAttribPointer(prg.aVertexNormal,3,gl.FLOAT, false, 0,0);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, object.ibo);
          gl.drawElements(gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT,0);
          gl.bindBuffer(gl.ARRAY_BUFFER, null);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
              
          }
  }

  var fps = 60;
  var rollVelocity = 0;
  var pitchVelocity = 0;
  var elevation = 0;
  var rotation = 0;
  function animate(){
      rotation += rollVelocity*4;
      elevation += pitchVelocity*4;
      draw();
      setTimeout(function() {
          requestAnimationFrame(animate);
      }, 10);

  }

  function keydown(ev) {
      var keyCode = ev.keyCode;
      if (keyCode == 87){
          pitchVelocity = 0.5;
      } else if (keyCode == 83){
          pitchVelocity = -0.5;
      } else if (keyCode == 65){
          rollVelocity = 0.5;
      } else if (keyCode == 68){
          rollVelocity = -0.5;
      }   
  }

  function keyup(ev) {
      var keyCode = ev.keyCode;
      if (keyCode == 87 || keyCode == 83){
          pitchVelocity = 0.0;
      } else if (keyCode == 65 || keyCode == 68){
          rollVelocity = 0.0;
      }  
  }
  var mainprg = null;
  function startup() {
      document.onkeydown = function(ev) {keydown(ev);};
      document.onkeyup = function(ev) {keyup(ev);};
      mainprg = new BuildCanvas("mycanvas");
      mainprg.configureGLHook = init;
      mainprg.loadSceneHook   = load;
      mainprg.drawSceneHook   = draw;
      mainprg.run();
      animate();
  }