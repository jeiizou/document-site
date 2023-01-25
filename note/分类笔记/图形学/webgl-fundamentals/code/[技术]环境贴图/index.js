'use strict';

function main() {
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector('#canvas');
  var gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 着色器程序
  var program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  // 获取变量地址
  var positionLocation = gl.getAttribLocation(program, 'a_position');
  var normalLocation = gl.getAttribLocation(program, 'a_normal');
  // 获取全局变量的变量地址
  var projectionLocation = gl.getUniformLocation(program, 'u_projection');
  var viewLocation = gl.getUniformLocation(program, 'u_view');
  var worldLocation = gl.getUniformLocation(program, 'u_world');
  var textureLocation = gl.getUniformLocation(program, 'u_texture');
  var worldCameraPositionLocation = gl.getUniformLocation(program, 'u_worldCameraPosition');

  // 创建和绑定缓冲区
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // 设置立方体的位置信息
  setGeometry(gl);

  // 创建一个发现的缓冲区
  var normalBuffer = gl.createBuffer();
  // 绑定这个缓冲区 (think of it as ARRAY_BUFFER = normalBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  // Put normals data into buffer
  setNormals(gl);

  // 创建和使用纹理
  createTexture(gl);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var modelXRotationRadians = degToRad(0);
  var modelYRotationRadians = degToRad(0);

  // Get the starting time.
  var then = 0;

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    // convert to seconds
    time *= 0.001;
    // Subtract the previous time from the current time
    var deltaTime = time - then;
    // Remember the current time for the next frame.
    then = time;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Animate the rotation
    modelYRotationRadians += -0.7 * deltaTime;
    modelXRotationRadians += -0.4 * deltaTime;

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // 设置position的值
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

    // 设置 normal 的值
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
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);
    gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);

    var cameraPosition = [0, 0, 2];
    var up = [0, 1, 0];
    var target = [0, 0, 0];

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var worldMatrix = m4.xRotation(modelXRotationRadians);
    worldMatrix = m4.yRotate(worldMatrix, modelYRotationRadians);

    // Set the uniforms
    gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
    gl.uniformMatrix4fv(viewLocation, false, viewMatrix);
    gl.uniformMatrix4fv(worldLocation, false, worldMatrix);
    gl.uniform3fv(worldCameraPositionLocation, cameraPosition);

    // Tell the shader to use texture unit 0 for u_texture
    gl.uniform1i(textureLocation, 0);

    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);

    requestAnimationFrame(drawScene);
  }
}

function generateFace(ctx, faceColor, textColor, text) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = faceColor;
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${width * 0.7}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textColor;
  ctx.fillText(text, width / 2, height / 2);
}

function createTexture(gl) {
  // 创建和绑定纹理
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  // 创建一个2D的上下恩绘制对象
  /** @type {Canvas2DRenderingContext} */
  const ctx = document.createElement('canvas').getContext('2d');

  ctx.canvas.width = 128;
  ctx.canvas.height = 128;

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: '../assets/pos-x.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: '../assets/neg-x.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: '../assets/pos-y.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: '../assets/neg-y.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: '../assets/pos-z.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: '../assets/neg-z.jpg',
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const { target, url } = faceInfo;

    // 上传画布到立方体贴图的每个面
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // 设置每个面，使其立即可渲染
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    // 异步加载图片
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function () {
      // 图片加载完成将其拷贝到纹理
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

// Fill the buffer with the values that define a cube.
function setGeometry(gl) {
  // prettier-ignore
  var positions = new Float32Array(
      [
      -0.5, -0.5,  -0.5,
      -0.5,  0.5,  -0.5,
       0.5, -0.5,  -0.5,
      -0.5,  0.5,  -0.5,
       0.5,  0.5,  -0.5,
       0.5, -0.5,  -0.5,
  
      -0.5, -0.5,   0.5,
       0.5, -0.5,   0.5,
      -0.5,  0.5,   0.5,
      -0.5,  0.5,   0.5,
       0.5, -0.5,   0.5,
       0.5,  0.5,   0.5,
  
      -0.5,   0.5, -0.5,
      -0.5,   0.5,  0.5,
       0.5,   0.5, -0.5,
      -0.5,   0.5,  0.5,
       0.5,   0.5,  0.5,
       0.5,   0.5, -0.5,
  
      -0.5,  -0.5, -0.5,
       0.5,  -0.5, -0.5,
      -0.5,  -0.5,  0.5,
      -0.5,  -0.5,  0.5,
       0.5,  -0.5, -0.5,
       0.5,  -0.5,  0.5,
  
      -0.5,  -0.5, -0.5,
      -0.5,  -0.5,  0.5,
      -0.5,   0.5, -0.5,
      -0.5,  -0.5,  0.5,
      -0.5,   0.5,  0.5,
      -0.5,   0.5, -0.5,
  
       0.5,  -0.5, -0.5,
       0.5,   0.5, -0.5,
       0.5,  -0.5,  0.5,
       0.5,  -0.5,  0.5,
       0.5,   0.5, -0.5,
       0.5,   0.5,  0.5,
  
      ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the buffer with normals for cube
function setNormals(gl) {
  // prettier-ignore
  var normals = new Float32Array(
      [
         0, 0, -1,
         0, 0, -1,
         0, 0, -1,
         0, 0, -1,
         0, 0, -1,
         0, 0, -1,
  
         0, 0, 1,
         0, 0, 1,
         0, 0, 1,
         0, 0, 1,
         0, 0, 1,
         0, 0, 1,
  
         0, 1, 0,
         0, 1, 0,
         0, 1, 0,
         0, 1, 0,
         0, 1, 0,
         0, 1, 0,
  
         0, -1, 0,
         0, -1, 0,
         0, -1, 0,
         0, -1, 0,
         0, -1, 0,
         0, -1, 0,
  
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
  
         1, 0, 0,
         1, 0, 0,
         1, 0, 0,
         1, 0, 0,
         1, 0, 0,
         1, 0, 0,
      ]);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
}

main();
