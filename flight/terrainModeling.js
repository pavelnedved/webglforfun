//push data from height to buffer, can be found in mp2.js
function pushtoBuffer(n, heightBuffer, minX, maxX, minY, maxY, vertexArray, xflip, yflip) {
    for(var i=0;i<=n;i++)
        for(var j=0;j<=n;j++) {
            var x=i;
            var y=j;
            vertexArray.push(minX +(maxX-minX)/n * i);
            vertexArray.push(minY +(maxY-minY)/n * j);
            var x = xflip ? n-i : i;
            var y = yflip ? n-j : j;
            vertexArray.push(heightBuffer[x + (n + 1) * y] *1.5/ n);
        }
}

//-------------------------------------------------------------------------
function terrainFromIteration(n, faceArray, normalArray) {

    for(var i=0;i<=n;i++)
        for(var j=0;j<=n;j++)
        {
            normalArray.push(0);
            normalArray.push(0);
            normalArray.push(1);
        }
    var numT=0;
    for(var i=0;i<n;i++)
        for(var j=0;j<n;j++)
        {
            var vid = i*(n+1) + j;
            faceArray.push(vid);
            faceArray.push(vid+1);
            faceArray.push(vid+n+1);

            faceArray.push(vid+1);
            faceArray.push(vid+1+n+1);
            faceArray.push(vid+n+1);
            numT+=2;
        }
    return numT;
}
//diamondSquare function just like the one from wiki
// some parts of the code are from the website 
//http://www.playfuljs.com/realistic-terrain-in-130-lines/
//which is an example of diamond square function
function diamondSquare(roughness) {
    var pieces = 128;
    //i take 128 as number of pieces for divide you can take others 
    var map = new Float32Array((pieces+1) * (pieces+1));
    function divide(size){
        var x, y, half =(size / 2);
        var scale = roughness * size;
        if(half < 1) return;
        for(y = half; y < pieces; y += size) {
            for(x = half; x < pieces; x += size) {
                square(x, y, half, Math.random() * scale * 2 - scale);
            }
        }
        for (y = 0; y <= pieces; y += half) {
            for (x = (y + half) % size; x <= pieces; x += size) {
                diamond(x, y, half, Math.random() * scale * 2 - scale);
            }
        }
        divide((size / 2));
    }
    function get(x, y) {
        if(x < 0 || x > pieces || y < 0 || y > pieces) return -1;
        return map[x + (pieces+1)*y];
    }
    function set(x, y, v){
        map[x + (pieces+1)*y] = v;
    }
    function average(values) {
        var valid = values.filter(function(val) { return val !== Number.MIN_VALUE; });
        var total = valid.reduce(function(sum, val) { return sum + val; }, 0);
        return total / valid.length;
    }
    function square(x, y, size, offset) {
        var ave = average([
            get(x - size, y - size),   // upper left
            get(x + size, y - size),   // upper right
            get(x + size, y + size),   // lower right
            get(x - size, y + size)    // lower left
        ]);
        set(x, y, ave + offset);
    }
    function diamond(x, y, size, offset) {
        var ave = average([
            get(x, y - size),      // top
            get(x + size, y),      // right
            get(x, y + size),      // bottom
            get(x - size, y)       // left
        ]);
        set(x, y, ave + offset);
    }
    divide(pieces);
    return map;
}

//same as the generate line function from example
function generateLinesFromIndexedTriangles(faceArray,lineArray)
{
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++)
    {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}



