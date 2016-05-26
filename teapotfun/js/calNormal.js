
var	calNormal = {
    calculateNormals : function(vertices, indices){
        var x=0; 
        var y=1;
        var z=2;
        var ns = [];
        for(var i=0;i<vertices.length;i=i+3){ //for each vertex, initialize normal x, normal y, normal z
            ns[i+x]=0.0;
            ns[i+y]=0.0;
            ns[i+z]=0.0;
        }
        
        for(var i=0;i<indices.length;i=i+3){ //we work on triads of vertices to calculate normals so i = i+3 (i = indicesices indicesex)
            var v0 = [];
            var v1 = [];
            var normal = [];	
            //p2 - p1
            v0[x] = vertices[3*indices[i+2]+x] - vertices[3*indices[i+1]+x];
            v0[y] = vertices[3*indices[i+2]+y] - vertices[3*indices[i+1]+y];
            v0[z] = vertices[3*indices[i+2]+z] - vertices[3*indices[i+1]+z];
            //p0 - p1
            v1[x] = vertices[3*indices[i]+x] - vertices[3*indices[i+1]+x];
            v1[y] = vertices[3*indices[i]+y] - vertices[3*indices[i+1]+y];
            v1[z] = vertices[3*indices[i]+z] - vertices[3*indices[i+1]+z];
            //cross product by Sarrus Rule
            normal[x] = v0[y]*v1[z] - v0[z]*v1[y];
            normal[y] = v0[z]*v1[x] - v0[x]*v1[z];
            normal[z] = v0[x]*v1[y] - v0[y]*v1[x];
            for(j=0;j<3;j++){ //update the normals of that triangle: sum of vectors
                ns[3*indices[i+j]+x] =  ns[3*indices[i+j]+x] + normal[x];
                ns[3*indices[i+j]+y] =  ns[3*indices[i+j]+y] + normal[y];
                ns[3*indices[i+j]+z] =  ns[3*indices[i+j]+z] + normal[z];
            }
        }
        //normalize the result
        for(var i=0;i<vertices.length;i=i+3){
            var nn=[];
            nn[x] = ns[i+x];
            nn[y] = ns[i+y];
            nn[z] = ns[i+z];
            
            var len = Math.sqrt((nn[x]*nn[x])+(nn[y]*nn[y])+(nn[z]*nn[z]));
            if (len == 0) len = 1.0;
            
            nn[x] = nn[x]/len;
            nn[y] = nn[y]/len;
            nn[z] = nn[z]/len;
            
            ns[i+x] = nn[x];
            ns[i+y] = nn[y];
            ns[i+z] = nn[z];
        }
        
        return ns;
    }
}