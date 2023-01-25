// MultiAttributeSize_Interleaved.js (c) 2012 matsuda
// Vertex shader program
let VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  "attribute vec4 a_Color;\n" +
  "varying vec4 v_Color;\n" + //varying变量
  "void main() {\n" +
  "  gl_Position = a_Position;\n" +
  "  gl_PointSize = 10.0;" +
  "  v_Color = a_Color;\n" + //将数据传给片元着色器
  "}\n";

// Fragment shader program
let FSHADER_SOURCE =
  "#ifdef GL_ES\n" +
  "precision mediump float;\n" +
  "#endif\n" +
  "varying vec4 v_Color;\n" +
  "void main() {\n" +
  "  gl_FragColor = v_Color;\n" +
  "}\n";

function main() {
  // Retrieve <canvas> element
  let canvas = document.getElementById("webgl");

  // Get the rendering context for WebGL
  let gl = getWebGLContext(canvas);
  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  // Set vertex coordinates and point sizes
  let n = initVertexBuffers(gl);
  if (n < 0) {
    console.log("Failed to set the vertex information");
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw three points
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(gl) {
  let verticesColors = new Float32Array([
    // Vertex coordinates and color
    0.0,  0.5,  1.0,  0.0,  0.0, 
    -0.5, -0.5,  0.0,  1.0,  0.0, 
     0.5, -0.5,  0.0,  0.0,  1.0, 
  ]);
  let n = 3; // The number of vertices

  //创建缓冲区对象
  let vertexColorBuffer = gl.createBuffer();
  if (!vertexColorBuffer) {
    console.log("Failed to create the buffer object");
    return false;
  }

  //将顶点坐标写入缓冲区对象并开启
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  let FSIZE = verticesColors.BYTES_PER_ELEMENT;

  let a_Position = gl.getAttribLocation(gl.program, "a_Position");

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);

  //将顶点尺寸写入缓冲区对象并开启
  let a_Color = gl.getAttribLocation(gl.program, "a_Color");

  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
  gl.enableVertexAttribArray(a_Color);

  return n;
}
