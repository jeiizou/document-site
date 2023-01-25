'use strict';

/* globals webglLessonsUI */

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  let canvas = document.querySelector('#canvas');
  let gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // setup GLSL program
  let program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  // look up where the vertex data needs to go.
  let positionLocation = gl.getAttribLocation(program, 'a_position');
  let normalLocation = gl.getAttribLocation(program, 'a_normal');

  // lookup uniforms
  let worldViewProjectionLocation = gl.getUniformLocation(program, 'u_worldViewProjection');
  let worldInverseTransposeLocation = gl.getUniformLocation(program, 'u_worldInverseTranspose');
  let colorLocation = gl.getUniformLocation(program, 'u_color');
  let rampLocation = gl.getUniformLocation(program, 'u_ramp');
  let rampSizeLocation = gl.getUniformLocation(program, 'u_rampSize');
  let linearAdustLocation = gl.getUniformLocation(program, 'u_linearAdjust');
  let reverseLightDirectionLocation = gl.getUniformLocation(program, 'u_reverseLightDirection');

  // Create a buffer to put positions in
  let positionBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put geometry data into buffer
  let numElements = setGeometry(gl);

  // Create a buffer to put normals in
  let normalBuffer = gl.createBuffer();
  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = normalBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  // Put normals data into buffer
  setNormals(gl);

  // make a 256 array where elements 0 to 127
  // go from 64 to 191 and elements 128 to 255
  // are all 255.
  const smoothSolid = new Array(256).fill(255);
  for (let i = 0; i < 128; ++i) {
    smoothSolid[i] = 64 + i;
  }

  const ramps = [
    { name: 'dark-white', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false, data: [80, 255] },
    {
      name: 'dark-white-skewed',
      color: [0.2, 1, 0.2, 1],
      format: gl.LUMINANCE,
      filter: false,
      data: [80, 80, 80, 255, 255],
    },
    { name: 'normal', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: true, data: [0, 255] },
    { name: '3-step', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false, data: [80, 160, 255] },
    {
      name: '4-step',
      color: [0.2, 1, 0.2, 1],
      format: gl.LUMINANCE,
      filter: false,
      data: [80, 140, 200, 255],
    },
    {
      name: '4-step skewed',
      color: [0.2, 1, 0.2, 1],
      format: gl.LUMINANCE,
      filter: false,
      data: [80, 80, 80, 80, 140, 200, 255],
    },
    {
      name: 'black-white-black',
      color: [0.2, 1, 0.2, 1],
      format: gl.LUMINANCE,
      filter: false,
      data: [80, 255, 80],
    },
    {
      name: 'stripes',
      color: [0.2, 1, 0.2, 1],
      format: gl.LUMINANCE,
      filter: false,
      data: [
        80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80, 255, 80,
        255, 80, 255, 80, 255, 80, 255, 80, 255,
      ],
    },
    {
      name: 'stripe',
      color: [0.2, 1, 0.2, 1],
      format: gl.LUMINANCE,
      filter: false,
      data: [
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255,
        255, 255, 255, 255, 255,
      ],
    },
    { name: 'smooth-solid', color: [0.2, 1, 0.2, 1], format: gl.LUMINANCE, filter: false, data: smoothSolid },
    {
      name: 'rgb',
      color: [1, 1, 1, 1],
      format: gl.RGB,
      filter: true,
      data: [255, 0, 0, 0, 255, 0, 0, 0, 255],
    },
  ];

  let elementsForFormat = {};
  elementsForFormat[gl.LUMINANCE] = 1;
  elementsForFormat[gl.RGB] = 3;

  ramps.forEach((ramp) => {
    const { name, format, filter, data } = ramp;
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const width = data.length / elementsForFormat[format];
    gl.texImage2D(
      gl.TEXTURE_2D, // target
      0, // mip level
      format, // internal format
      width,
      1, // height
      0, // border
      format, // format
      gl.UNSIGNED_BYTE, // type
      new Uint8Array(data),
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter ? gl.LINEAR : gl.NEAREST);
    ramp.texture = tex;
    ramp.size = [width, 1];
  });

  let data = {
    ramp: 0,
  };
  webglLessonsUI.setupUI(document.querySelector('#ui'), data, [
    { type: 'option', key: 'ramp', change: drawScene, options: ramps.map((r) => r.name) },
  ]);

  function radToDeg(r) {
    return (r * 180) / Math.PI;
  }

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  let fieldOfViewRadians = degToRad(60);
  let fRotationRadians = 0;

  drawScene();

  // Setup a ui.
  webglLessonsUI.setupSlider('#fRotation', {
    value: radToDeg(fRotationRadians),
    slide: updateRotation,
    min: -360,
    max: 360,
  });

  function updateRotation(event, ui) {
    fRotationRadians = degToRad(ui.value);
    drawScene();
  }

  // Draw the scene.
  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Turn on culling. By default backfacing triangles
    // will be culled.
    gl.enable(gl.CULL_FACE);

    // Enable the depth buffer
    gl.enable(gl.DEPTH_TEST);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Turn on the position attribute
    gl.enableVertexAttribArray(positionLocation);

    // Bind the position buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the position attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    var size = 3; // 3 components per iteration
    var type = gl.FLOAT; // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(positionLocation, size, type, normalize, stride, offset);

    // Turn on the normal attribute
    gl.enableVertexAttribArray(normalLocation);

    // Bind the normal buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    // Tell the attribute how to get data out of normalBuffer (ARRAY_BUFFER)
    var size = 3; // 3 components per iteration
    var type = gl.FLOAT; // the data is 32bit floating point values
    var normalize = false; // normalize the data (convert from 0-255 to 0-1)
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(normalLocation, size, type, normalize, stride, offset);

    // Compute the projection matrix
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let zNear = 1;
    let zFar = 50;
    let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    // Compute the camera's matrix
    let camera = [0, 0, 20];
    let target = [0, 0, 0];
    let up = [0, 1, 0];
    let cameraMatrix = m4.lookAt(camera, target, up);

    // Make a view matrix from the camera matrix.
    let viewMatrix = m4.inverse(cameraMatrix);

    // Compute a view projection matrix
    let viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // Draw a F at the origin
    let worldMatrix = m4.yRotation(fRotationRadians);

    // Multiply the matrices.
    let worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
    let worldInverseMatrix = m4.inverse(worldMatrix);
    let worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

    // Set the matrices
    gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);

    {
      const { texture, color, size, filter } = ramps[data.ramp];

      // Set the color to use
      gl.uniform4fv(colorLocation, color);

      // set the light direction.
      gl.uniform3fv(reverseLightDirectionLocation, m4.normalize([-1.75, 0.7, 1]));

      // bind the texture to active texture unit 0
      gl.activeTexture(gl.TEXTURE0 + 0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // tell the shader that u_ramp should use the texture on texture unit 0
      gl.uniform1i(rampLocation, 0);
      gl.uniform2fv(rampSizeLocation, size);

      // adjust if linear
      gl.uniform1f(linearAdustLocation, filter ? 1 : 0);
    }

    // Draw the geometry.
    let primitiveType = gl.TRIANGLES;
    var offset = 0;
    gl.drawArrays(primitiveType, offset, numElements);
  }
}

// Fill the buffer positions for the head.
function setGeometry(gl) {
  let positions = new Float32Array(HeadData.positions);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  return positions.length / 3;
}

// Fill the buffer with normals for the head.
function setNormals(gl, numElements) {
  let { normals } = HeadData;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
}

main();
