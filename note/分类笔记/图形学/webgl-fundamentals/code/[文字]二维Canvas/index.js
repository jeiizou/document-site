'use strict';

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  let canvas = document.querySelector('#canvas');
  let gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 找到文字画布
  let textCanvas = document.querySelector('#text');

  // 创建一个二维上下文
  let ctx = textCanvas.getContext('2d');

  // 设置着色器程序
  let program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  // 获取需要设置的变量位置
  let positionLocation = gl.getAttribLocation(program, 'a_position');
  let colorLocation = gl.getAttribLocation(program, 'a_color');

  // 获取全局变量的值
  let matrixLocation = gl.getUniformLocation(program, 'u_matrix');

  // 创建缓冲区
  let positionBuffer = gl.createBuffer();
  // 绑定缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // 设置F的面数据
  setGeometry(gl);

  // 创建一个颜色缓冲区
  let colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  setColors(gl);

  function radToDeg(r) {
    return (r * 180) / Math.PI;
  }

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  let translation = [0, 30, -360];
  let rotation = [degToRad(190), degToRad(0), degToRad(0)];
  let scale = [1, 1, 1];
  let fieldOfViewRadians = degToRad(60);
  let rotationSpeed = 1.2;

  let then = 0;

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(clock) {
    // Convert to seconds
    clock *= 0.001;
    // Subtract the previous time from the current time
    let deltaTime = clock - then;
    // Remember the current time for the next frame.
    then = clock;

    // Every frame increase the rotation a little.
    rotation[1] += rotationSpeed * deltaTime;
    rotation[2] += deltaTime;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    webglUtils.resizeCanvasToDisplaySize(ctx.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Clear the 2D canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

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

    // Turn on the color attribute
    gl.enableVertexAttribArray(colorLocation);

    // Bind the color buffer.
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

    // Tell the attribute how to get data out of colorBuffer (ARRAY_BUFFER)
    var size = 3; // 3 components per iteration
    var type = gl.UNSIGNED_BYTE; // the data is 8bit unsigned values
    var normalize = true; // normalize the data (convert from 0-255 to 0-1)
    var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0; // start at the beginning of the buffer
    gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);

    // Compute the matrices
    let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    let spread = 170;
    for (let yy = -1; yy <= 1; ++yy) {
      for (let xx = -2; xx <= 2; ++xx) {
        let matrix = m4.translate(
          projectionMatrix,
          translation[0] + xx * spread,
          translation[1] + yy * spread,
          translation[2],
        );
        matrix = m4.xRotate(matrix, rotation[0]);
        matrix = m4.yRotate(matrix, rotation[1] + yy * xx * 0.2);
        matrix = m4.zRotate(matrix, rotation[2] + (yy * 3 + xx) * 0.1);
        matrix = m4.translate(matrix, -50, -75, 0);

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, matrix);

        // Draw the geometry.
        gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);

        // compute a clipspace position
        // using the matrix we computed for the F
        let clipspace = m4.transformVector(matrix, [100, 0, 0, 1]);

        // divide X and Y by W just like the GPU does.
        clipspace[0] /= clipspace[3];
        clipspace[1] /= clipspace[3];

        // convert from clipspace to pixels
        let pixelX = (clipspace[0] * 0.5 + 0.5) * gl.canvas.width;
        let pixelY = (clipspace[1] * -0.5 + 0.5) * gl.canvas.height;

        // 绘制箭头和文字

        // 保存画布设置
        ctx.save();

        // 将画布原点移动到 F 的正面右上角
        ctx.translate(pixelX, pixelY);

        // 绘制箭头
        ctx.beginPath();
        ctx.moveTo(10, 5);
        ctx.lineTo(0, 0);
        ctx.lineTo(5, 10);
        ctx.moveTo(0, 0);
        ctx.lineTo(15, 15);
        ctx.stroke();

        // 绘制文字
        ctx.fillText(`${String(xx)},${yy}`, 20, 20);

        // 还原画布设置
        ctx.restore();
      }
    }

    requestAnimationFrame(drawScene);
  }
}

// Fill the buffer with the values that define a letter 'F'.
function setGeometry(gl) {
  // prettier-ignore
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      // left column front
      0, 0, 0,
      0, 150, 0,
      30, 0, 0,
      0, 150, 0,
      30, 150, 0,
      30, 0, 0,

      // top rung front
      30, 0, 0,
      30, 30, 0,
      100, 0, 0,
      30, 30, 0,
      100, 30, 0,
      100, 0, 0,

      // middle rung front
      30, 60, 0,
      30, 90, 0,
      67, 60, 0,
      30, 90, 0,
      67, 90, 0,
      67, 60, 0,

      // left column back
      0, 0, 30,
      30, 0, 30,
      0, 150, 30,
      0, 150, 30,
      30, 0, 30,
      30, 150, 30,

      // top rung back
      30, 0, 30,
      100, 0, 30,
      30, 30, 30,
      30, 30, 30,
      100, 0, 30,
      100, 30, 30,

      // middle rung back
      30, 60, 30,
      67, 60, 30,
      30, 90, 30,
      30, 90, 30,
      67, 60, 30,
      67, 90, 30,

      // top
      0, 0, 0,
      100, 0, 0,
      100, 0, 30,
      0, 0, 0,
      100, 0, 30,
      0, 0, 30,

      // top rung right
      100, 0, 0,
      100, 30, 0,
      100, 30, 30,
      100, 0, 0,
      100, 30, 30,
      100, 0, 30,

      // under top rung
      30, 30, 0,
      30, 30, 30,
      100, 30, 30,
      30, 30, 0,
      100, 30, 30,
      100, 30, 0,

      // between top rung and middle
      30, 30, 0,
      30, 60, 30,
      30, 30, 30,
      30, 30, 0,
      30, 60, 0,
      30, 60, 30,

      // top of middle rung
      30, 60, 0,
      67, 60, 30,
      30, 60, 30,
      30, 60, 0,
      67, 60, 0,
      67, 60, 30,

      // right of middle rung
      67, 60, 0,
      67, 90, 30,
      67, 60, 30,
      67, 60, 0,
      67, 90, 0,
      67, 90, 30,

      // bottom of middle rung.
      30, 90, 0,
      30, 90, 30,
      67, 90, 30,
      30, 90, 0,
      67, 90, 30,
      67, 90, 0,

      // right of bottom
      30, 90, 0,
      30, 150, 30,
      30, 90, 30,
      30, 90, 0,
      30, 150, 0,
      30, 150, 30,

      // bottom
      0, 150, 0,
      0, 150, 30,
      30, 150, 30,
      0, 150, 0,
      30, 150, 30,
      30, 150, 0,

      // left side
      0, 0, 0,
      0, 0, 30,
      0, 150, 30,
      0, 0, 0,
      0, 150, 30,
      0, 150, 0]),
    gl.STATIC_DRAW);
}

// Fill the buffer with colors for the 'F'.
function setColors(gl) {
  // prettier-ignore
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Uint8Array([
      // left column front
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,

      // top rung front
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,

      // middle rung front
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,
      200, 70, 120,

      // left column back
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,

      // top rung back
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,

      // middle rung back
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,
      80, 70, 200,

      // top
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,
      70, 200, 210,

      // top rung right
      200, 200, 70,
      200, 200, 70,
      200, 200, 70,
      200, 200, 70,
      200, 200, 70,
      200, 200, 70,

      // under top rung
      210, 100, 70,
      210, 100, 70,
      210, 100, 70,
      210, 100, 70,
      210, 100, 70,
      210, 100, 70,

      // between top rung and middle
      210, 160, 70,
      210, 160, 70,
      210, 160, 70,
      210, 160, 70,
      210, 160, 70,
      210, 160, 70,

      // top of middle rung
      70, 180, 210,
      70, 180, 210,
      70, 180, 210,
      70, 180, 210,
      70, 180, 210,
      70, 180, 210,

      // right of middle rung
      100, 70, 210,
      100, 70, 210,
      100, 70, 210,
      100, 70, 210,
      100, 70, 210,
      100, 70, 210,

      // bottom of middle rung.
      76, 210, 100,
      76, 210, 100,
      76, 210, 100,
      76, 210, 100,
      76, 210, 100,
      76, 210, 100,

      // right of bottom
      140, 210, 80,
      140, 210, 80,
      140, 210, 80,
      140, 210, 80,
      140, 210, 80,
      140, 210, 80,

      // bottom
      90, 130, 110,
      90, 130, 110,
      90, 130, 110,
      90, 130, 110,
      90, 130, 110,
      90, 130, 110,

      // left side
      160, 160, 220,
      160, 160, 220,
      160, 160, 220,
      160, 160, 220,
      160, 160, 220,
      160, 160, 220]),
    gl.STATIC_DRAW);
}

main();
