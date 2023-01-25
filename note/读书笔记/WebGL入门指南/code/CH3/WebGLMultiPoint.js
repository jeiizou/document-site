//在三角面不用指定点的大小
let VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  // "uniform vec4 u_Translation;\n" +
  "uniform float u_CosB, u_SinB;\n" +
  "void main() {\n" +
  // "  gl_Position = a_Position+u_Translation;\n" +
  // "  gl_PointSize = 10.0;\n" +
  "  gl_Position.x = a_Position.x * u_CosB - a_Position.y * u_SinB;\n" +
  "  gl_Position.y = a_Position.x * u_SinB + a_Position.y * u_CosB;\n" +
  "  gl_Position.z = a_Position.z;\n" +
  "  gl_Position.w = 1.0;\n" +
  "}\n";

let FSHADER_SOURCE =
  "void main() {\n" + "  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n" + "}\n";

// let Tx = 0.5,
//   Ty = 0.5,
//   Tz = 0.0;

let ANGLE = 90.0;

function main() {
  // Retrieve <canvas> element
  let canvas = document.getElementById("canvas-example");

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

  // Write the positions of vertices to a vertex shader
  let n = initVertexBuffers(gl);
  if (n < 0) {
    console.log("Failed to set the positions of the vertices");
    return;
  }

  // let u_Translation = gl.getUniformLocation(gl.program, "u_Translation");
  // if (!u_Translation) {
  //   console.log("Failed to get the storage location of u_Translation");
  //   return;
  // }
  // gl.uniform4f(u_Translation, Tx, Ty, Tz, 0.0);

  let radian = (Math.PI * ANGLE) / 180.0; // Convert to radians
  let cosB = Math.cos(radian);
  let sinB = Math.sin(radian);

  let u_CosB = gl.getUniformLocation(gl.program, "u_CosB");
  let u_SinB = gl.getUniformLocation(gl.program, "u_SinB");
  if (!u_CosB || !u_SinB) {
    console.log("Failed to get the storage location of u_CosB or u_SinB");
    return;
  }
  gl.uniform1f(u_CosB, cosB);
  gl.uniform1f(u_SinB, sinB);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the rectangle
  // gl.drawArrays(gl.POINTS, 0, n);
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function initVertexBuffers(gl) {
  let vertices = new Float32Array([0, 0.5, -0.5, -0.5, 0.5, -0.5]);
  let n = 3; // The number of vertices

  // Create a buffer object
  let vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object");
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write date into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  let a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return -1;
  }
  // Assign the buffer object to a_Position letiable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);

  // Enable the assignment to a_Position letiable
  gl.enableVertexAttribArray(a_Position);

  return n;
}

main();
