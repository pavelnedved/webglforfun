var BuildCanvas_RENDER = undefined;
function BuildCanvas(canvas) {
    this.loadSceneHook = undefined;
    this.configureGLHook = undefined;
    gl = getGLContext(canvas);
    var idk = document.getElementById(name);
    var ctx = null;
    var names = ["webgl", "experimental-webgl"];
    for (var i = 0; i < names.length; ++i) {
        try {
            ctx = idk.getContext(names[i]);
        } 
        catch(e) {}
            if (ctx) {
                break;
            }
    }
    Shader.load();  
}
  
BuildCanvas.prototype.run = function(){
        this.configureGLHook();
        this.loadSceneHook();
        BuildCanvas_RENDER = this.drawSceneHook;
        BuildCanvas_RENDER();

 }

function getGLContext(name){
    
    var canvas = document.getElementById(name);
    var ctx = null;
    
    if (canvas == null){
        alert('there is no canvas on this page');
        return null;
    }
    else {
        c_width = canvas.width;
        c_height = canvas.height;
    }
            
    var names = ["webgl", "experimental-webgl"];

    for (var i = 0; i < names.length; ++i) {
    try {
        ctx = canvas.getContext(names[i]);
    } 
    catch(e) {}
        if (ctx) {
            break;
        }
    }
    return ctx;
}
