// MultiAttributeSize_Interleaved.js (c) 2012 matsuda
// Vertex shader program
let VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  "attribute float a_PointSize;\n" +
  "void main() {\n" +
  "  gl_Position = a_Position;\n" +
  "  gl_PointSize = a_PointSize;\n" +
  "}\n";

// Fragment shader program
let FSHADER_SOURCE =
  "void main() {\n" +
  "  gl_FragColor = vec4(1.0,0.0,0.0,1.0);\n" +
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
  gl.drawArrays(gl.POINTS, 0, n);
}

function initVertexBuffers(gl) {
  let verticesSizes = new Float32Array([
    // Coordinate and size of points
    0.0,
    0.5,
    10.0,
    -0.5,
    -0.5,
    20.0,
    0.5,
    -0.5,
    30.0
  ]);
  let n = 3; // The number of vertices

  //创建缓冲区对象
  let vertexSizeBuffer = gl.createBuffer();

  //将顶点坐标写入缓冲区对象并开启
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexSizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesSizes, gl.STATIC_DRAW);

  let FSIZE = verticesSizes.BYTES_PER_ELEMENT;

  let a_Position = gl.getAttribLocation(gl.program, "a_Position");

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 3, 0);
  gl.enableVertexAttribArray(a_Position);

  //将顶点尺寸写入缓冲区对象并开启
  let a_PointSize = gl.getAttribLocation(gl.program, "a_PointSize");

  gl.vertexAttribPointer(a_PointSize, 1, gl.FLOAT, false, FSIZE * 3, FSIZE * 2);
  gl.enableVertexAttribArray(a_PointSize);

  return n;
}
