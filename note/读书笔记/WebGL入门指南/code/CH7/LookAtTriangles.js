let VSHADER_SOURCE = `
attribute vec4 a_Position;
attribute vec4 a_Color;
uniform mat4 u_ViewMatrix;
varying vec4 v_Color;
void main(){
    gl_Position = u_ViewMatrix * a_Position;
    v_Color = a_Color;
}`;

let FSHADER_SOURCE = `
#ifdef GL_ES
precision mediump float;
#endif
varying vec4 v_Color;
void main() {
    gl_FragColor=v_Color;
}`;

function main() {
    // 获取元素
    var canvas = document.getElementById('webgl');
  
    //获取绘制上下文
    var gl = getWebGLContext(canvas);
    if (!gl) {
      console.log('Failed to get the rendering context for WebGL');
      return;
    }
  
    // 初始化着色器
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
      console.log('Failed to intialize shaders.');
      return;
    }
  
    // Set the vertex coordinates and color (the blue triangle is in the front)
    var n = initVertexBuffers(gl);
    if (n < 0) {
      console.log('Failed to set the vertex information');
      return;
    }
  
    // Specify the color for clearing <canvas>
    gl.clearColor(0, 0, 0, 1);
  
    // Get the storage location of u_ViewMatrix
    var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) { 
      console.log('Failed to get the storage locations of u_ViewMatrix');
      return;
    }
  
    // Set the matrix to be used for to set the camera view
    var viewMatrix = new Matrix4();
    viewMatrix.setLookAt(0.20, 0.25, 0.25, 0, 0, 0, 0, 1, 0);
  
    // Set the view matrix
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  
    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLES, 0, n);
  }
  
  function initVertexBuffers(gl) {
    var verticesColors = new Float32Array([
      //三角形顶点位置, 以及颜色的RGBA分量
       0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, // The back green one
      -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,
       0.5, -0.5,  -0.4,  1.0,  0.4,  0.4, 
     
       0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
      -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
       0.0, -0.6,  -0.2,  1.0,  1.0,  0.4, 
  
       0.0,  0.5,   0.0,  0.4,  0.4,  1.0,  // The front blue one 
      -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
       0.5, -0.5,   0.0,  1.0,  0.4,  0.4, 
    ]);
    var n = 9;
  
    // Create a buffer object
    var vertexColorbuffer = gl.createBuffer();  
    if (!vertexColorbuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
  
    // Write the vertex coordinates and color to the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
  
    var FSIZE = verticesColors.BYTES_PER_ELEMENT;
    // Assign the buffer object to a_Position and enable the assignment
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if(a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return -1;
    }
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
    gl.enableVertexAttribArray(a_Position);
  
    // Assign the buffer object to a_Color and enable the assignment
    var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
    if(a_Color < 0) {
      console.log('Failed to get the storage location of a_Color');
      return -1;
    }
    gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
    gl.enableVertexAttribArray(a_Color);
  
    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  
    return n;
  }
  
