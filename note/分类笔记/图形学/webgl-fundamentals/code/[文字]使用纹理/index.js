'use strict';

let textCtx = document.createElement('canvas').getContext('2d');

// Puts text in center of canvas.
function makeTextCanvas(text, width, height) {
  textCtx.canvas.width = width;
  textCtx.canvas.height = height;
  textCtx.font = '20px monospace';
  textCtx.textAlign = 'center';
  textCtx.textBaseline = 'middle';
  textCtx.fillStyle = 'white';
  textCtx.clearRect(0, 0, textCtx.canvas.width, textCtx.canvas.height);
  textCtx.fillText(text, width / 2, height / 2);
  return textCtx.canvas;
}

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  let canvas = document.querySelector('#canvas');
  let gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // Create data for 'F'
  let fBufferInfo = primitives.create3DFBufferInfo(gl);
  // Create a unit quad for the 'text'
  let textBufferInfo = primitives.createPlaneBufferInfo(gl, 1, 1, 1, 1, m4.xRotation(Math.PI / 2));

  // setup GLSL programs
  let fProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
  let textProgramInfo = webglUtils.createProgramInfo(gl, ['text-vertex-shader', 'text-fragment-shader']);

  // colors, 1 for each F
  let colors = [
    [0.0, 0.0, 0.0, 1], // 0
    [1.0, 0.0, 0.0, 1], // 1
    [0.0, 1.0, 0.0, 1], // 2
    [1.0, 1.0, 0.0, 1], // 3
    [0.0, 0.0, 1.0, 1], // 4
    [1.0, 0.0, 1.0, 1], // 5
    [0.0, 1.0, 1.0, 1], // 6
    [0.5, 0.5, 0.5, 1], // 7
    [0.5, 0.0, 0.0, 1], // 8
    [0.0, 0.0, 0.0, 1], // 9
    [0.5, 5.0, 0.0, 1], // 10
    [0.0, 5.0, 0.0, 1], // 11
    [0.5, 0.0, 5.0, 1], // 12,
    [0.0, 0.0, 5.0, 1], // 13,
    [0.5, 5.0, 5.0, 1], // 14,
    [0.0, 5.0, 5.0, 1], // 15,
  ];

  // create text textures, one for each F
  let textTextures = [
    'anna', // 0
    'colin', // 1
    'james', // 2
    'danny', // 3
    'kalin', // 4
    'hiro', // 5
    'eddie', // 6
    'shu', // 7
    'brian', // 8
    'tami', // 9
    'rick', // 10
    'gene', // 11
    'natalie', // 12,
    'evan', // 13,
    'sakura', // 14,
    'kai', // 15,
  ].map(function (name) {
    let textCanvas = makeTextCanvas(name, 100, 26);
    let textWidth = textCanvas.width;
    let textHeight = textCanvas.height;
    let textTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    // make sure we can render it even if it's not a power of 2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return {
      texture: textTex,
      width: textWidth,
      height: textHeight,
    };
  });

  let fUniforms = {
    u_matrix: m4.identity(),
  };

  let textUniforms = {
    u_matrix: m4.identity(),
    u_texture: null,
  };

  function radToDeg(r) {
    return (r * 180) / Math.PI;
  }

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  let translation = [0, 30, 0];
  let rotation = [degToRad(190), degToRad(0), degToRad(0)];
  let scale = [1, 1, 1];
  let fieldOfViewRadians = degToRad(60);
  let rotationSpeed = 1.2;

  let then = 0;

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(now) {
    // Convert to seconds
    now *= 0.001;
    // Subtract the previous time from the current time
    let deltaTime = now - then;
    // Remember the current time for the next frame.
    then = now;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Every frame increase the rotation a little.
    rotation[1] += rotationSpeed * deltaTime;

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.depthMask(true);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the matrices used for all objects
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    let cameraRadius = 360;
    let cameraPosition = [Math.cos(now) * cameraRadius, 0, Math.sin(now) * cameraRadius];
    let target = [0, 0, 0];
    let up = [0, 1, 0];
    let cameraMatrix = m4.lookAt(cameraPosition, target, up);
    let viewMatrix = m4.inverse(cameraMatrix);

    let textPositions = [];

    // setup to draw the 'F'
    gl.useProgram(fProgramInfo.program);

    webglUtils.setBuffersAndAttributes(gl, fProgramInfo, fBufferInfo);

    // draw the Fs.
    let spread = 170;
    for (let yy = -1; yy <= 1; ++yy) {
      for (let xx = -2; xx <= 2; ++xx) {
        let fViewMatrix = m4.translate(
          viewMatrix,
          translation[0] + xx * spread,
          translation[1] + yy * spread,
          translation[2],
        );
        fViewMatrix = m4.xRotate(fViewMatrix, rotation[0]);
        fViewMatrix = m4.yRotate(fViewMatrix, rotation[1] + yy * xx * 0.2);
        fViewMatrix = m4.zRotate(fViewMatrix, rotation[2] + now + (yy * 3 + xx) * 0.1);
        fViewMatrix = m4.scale(fViewMatrix, scale[0], scale[1], scale[2]);
        fViewMatrix = m4.translate(fViewMatrix, -50, -75, 0);
        textPositions.push([fViewMatrix[12], fViewMatrix[13], fViewMatrix[14]]);

        fUniforms.u_matrix = m4.multiply(projectionMatrix, fViewMatrix);

        webglUtils.setUniforms(fProgramInfo, fUniforms);

        // Draw the geometry.
        gl.drawElements(gl.TRIANGLES, fBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
      }
    }

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    // setup to draw the text.
    gl.useProgram(textProgramInfo.program);

    webglUtils.setBuffersAndAttributes(gl, textProgramInfo, textBufferInfo);

    textPositions.forEach(function (pos, ndx) {
      // draw the text

      // select a texture
      let tex = textTextures[ndx];

      // use just the view position of the 'F' for the text

      // because pos is in view space that means it's a vector from the eye to
      // some position. So translate along that vector back toward the eye some distance
      let fromEye = m4.normalize(pos);
      let amountToMoveTowardEye = 150; // because the F is 150 units long
      let viewX = pos[0] - fromEye[0] * amountToMoveTowardEye;
      let viewY = pos[1] - fromEye[1] * amountToMoveTowardEye;
      let viewZ = pos[2] - fromEye[2] * amountToMoveTowardEye;
      let desiredTextScale = -1 / gl.canvas.height; // 1x1 pixels
      let scale = viewZ * desiredTextScale;
      let textMatrix = m4.translate(projectionMatrix, viewX, viewY, viewZ);
      // scale the F to the size we need it.
      textMatrix = m4.scale(textMatrix, tex.width * scale, tex.height * scale, 1);

      m4.copy(textMatrix, textUniforms.u_matrix);
      textUniforms.u_texture = tex.texture;
      textUniforms.u_color = colors[ndx];
      webglUtils.setUniforms(textProgramInfo, textUniforms);

      // Draw the text.
      gl.drawElements(gl.TRIANGLES, textBufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    });

    requestAnimationFrame(drawScene);
  }
}

main();
