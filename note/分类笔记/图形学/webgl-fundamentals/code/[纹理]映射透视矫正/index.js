'use strict';

function main() {
  // Get A WebGL context
  var canvas = document.querySelector('#canvas');
  var gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // setup GLSL program
  var program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-2d', 'fragment-shader-2d']);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
  var brightnessAttributeLocation = gl.getAttribLocation(program, 'a_brightness');

  // Create a buffer and put 12 clip space points in it.
  // 4 rectangles, 2 triangles each, 3 vertices per triangle
  var positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  var mult = 20;
  var positions = [
    -0.8,
    0.8,
    0,
    1, // 1st rect 1st triangle
    0.8,
    0.8,
    0,
    1,
    -0.8,
    0.2,
    0,
    1,
    -0.8,
    0.2,
    0,
    1, // 1st rect 2nd triangle
    0.8,
    0.8,
    0,
    1,
    0.8,
    0.2,
    0,
    1,

    -0.8,
    -0.2,
    0,
    1, // 2nd rect 1st triangle
    0.8 * mult,
    -0.2 * mult,
    0,
    mult,
    -0.8,
    -0.8,
    0,
    1,
    -0.8,
    -0.8,
    0,
    1, // 2nd rect 2nd triangle
    0.8 * mult,
    -0.2 * mult,
    0,
    mult,
    0.8 * mult,
    -0.8 * mult,
    0,
    mult,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Create a buffer and put 12 brightness values in it
  var brightnessBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = brightnessBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);

  var brightness = [
    0, // 1st rect 1st triangle
    1,
    0,
    0, // 1st rect 2nd triangle
    1,
    1,

    0, // 2nd rect 1st triangle
    1,
    0,
    0, // 2nd rect 2nd triangle
    1,
    1,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(brightness), gl.STATIC_DRAW);

  // code above this line is initialization code.
  // code below this line is rendering code.

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 4; // 4 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);

  // Turn on the attribute
  gl.enableVertexAttribArray(brightnessAttributeLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, brightnessBuffer);

  // Tell the attribute how to get data out of brightnessBuffer (ARRAY_BUFFER)
  var size = 1; // 1 component per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(brightnessAttributeLocation, size, type, normalize, stride, offset);

  // draw
  var primitiveType = gl.TRIANGLES;
  var offset = 0;
  var count = 4 * 3; // 4 triangles, 3 vertices each
  gl.drawArrays(primitiveType, offset, count);
}

main();
