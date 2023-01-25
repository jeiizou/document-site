'use strict';

function main() {
  // 获取WebGL上下文
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector('#canvas');
  var gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 创建矩阵栈
  var matrixStack = new MatrixStack();

  // 设置着色器程序
  var program = webglUtils.createProgramFromScripts(gl, [
    'drawImage-vertex-shader',
    'drawImage-fragment-shader',
  ]);

  // look up where the vertex data needs to go.
  var positionLocation = gl.getAttribLocation(program, 'a_position');
  var texcoordLocation = gl.getAttribLocation(program, 'a_texcoord');

  // lookup uniforms
  var matrixLocation = gl.getUniformLocation(program, 'u_matrix');
  var textureMatrixLocation = gl.getUniformLocation(program, 'u_textureMatrix');
  var textureLocation = gl.getUniformLocation(program, 'u_texture');

  // Create a buffer.
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Put a unit quad in the buffer
  var positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Create a buffer for texture coords
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);

  // Put texcoords in the buffer
  var texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

  // creates a texture info { width: w, height: h, texture: tex }
  // The texture will start with 1x1 pixels and be updated
  // when the image has loaded
  function loadImageAndCreateTextureInfo(url) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 255, 255]),
    );

    // let's assume all images are not a power of 2
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    var textureInfo = {
      width: 1, // we don't know the size until it loads
      height: 1,
      texture: tex,
    };
    var img = new Image();
    img.addEventListener('load', function () {
      textureInfo.width = img.width;
      textureInfo.height = img.height;

      gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    });
    img.src = url;

    return textureInfo;
  }

  var textureInfo = loadImageAndCreateTextureInfo('../assets/star.jpeg');

  function draw(time) {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clear(gl.COLOR_BUFFER_BIT);

    matrixStack.save();
    matrixStack.translate(gl.canvas.width / 2, gl.canvas.height / 2);
    matrixStack.rotateZ(time);
    matrixStack.save();
    {
      matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);

      drawImage(textureInfo.texture, textureInfo.width, textureInfo.height, 0, 0);
    }
    matrixStack.restore();

    matrixStack.save();
    {
      // We're at the center of the center image so go to the top/left corner
      matrixStack.translate(textureInfo.width / -2, textureInfo.height / -2);
      matrixStack.rotateZ(Math.sin(time * 2.2));
      matrixStack.scale(0.2, 0.2);
      // Now we want the bottom/right corner of the image we're about to draw
      matrixStack.translate(-textureInfo.width, -textureInfo.height);

      drawImage(textureInfo.texture, textureInfo.width, textureInfo.height, 0, 0);
    }
    matrixStack.restore();

    matrixStack.save();
    {
      // We're at the center of the center image so go to the top/right corner
      matrixStack.translate(textureInfo.width / 2, textureInfo.height / -2);
      matrixStack.rotateZ(Math.sin(time * 2.3));
      matrixStack.scale(0.2, 0.2);
      // Now we want the bottom/right corner of the image we're about to draw
      matrixStack.translate(0, -textureInfo.height);

      drawImage(textureInfo.texture, textureInfo.width, textureInfo.height, 0, 0);
    }
    matrixStack.restore();

    matrixStack.save();
    {
      // We're at the center of the center image so go to the bottom/left corner
      matrixStack.translate(textureInfo.width / -2, textureInfo.height / 2);
      matrixStack.rotateZ(Math.sin(time * 2.4));
      matrixStack.scale(0.2, 0.2);
      // Now we want the top/right corner of the image we're about to draw
      matrixStack.translate(-textureInfo.width, 0);

      drawImage(textureInfo.texture, textureInfo.width, textureInfo.height, 0, 0);
    }
    matrixStack.restore();

    matrixStack.save();
    {
      // We're at the center of the center image so go to the bottom/right corner
      matrixStack.translate(textureInfo.width / 2, textureInfo.height / 2);
      matrixStack.rotateZ(Math.sin(time * 2.5));
      matrixStack.scale(0.2, 0.2);
      // Now we want the top/left corner of the image we're about to draw
      matrixStack.translate(0, 0); // 0,0 means this line is not really doing anything

      drawImage(textureInfo.texture, textureInfo.width, textureInfo.height, 0, 0);
    }
    matrixStack.restore();

    matrixStack.restore();
  }

  var then = 0;
  function render(time) {
    time *= 0.001;
    var now = time;
    var deltaTime = Math.min(0.1, now - then);
    then = now;

    draw(time);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  // Unlike images, textures do not have a width and height associated
  // with them so we'll pass in the width and height of the texture
  function drawImage(
    tex,
    texWidth,
    texHeight,
    srcX,
    srcY,
    srcWidth,
    srcHeight,
    dstX,
    dstY,
    dstWidth,
    dstHeight,
  ) {
    if (dstX === undefined) {
      dstX = srcX;
      srcX = 0;
    }
    if (dstY === undefined) {
      dstY = srcY;
      srcY = 0;
    }
    if (srcWidth === undefined) {
      srcWidth = texWidth;
    }
    if (srcHeight === undefined) {
      srcHeight = texHeight;
    }
    if (dstWidth === undefined) {
      dstWidth = srcWidth;
      srcWidth = texWidth;
    }
    if (dstHeight === undefined) {
      dstHeight = srcHeight;
      srcHeight = texHeight;
    }

    gl.bindTexture(gl.TEXTURE_2D, tex);

    // 告诉webgl使用着色器程序
    gl.useProgram(program);

    // Setup the attributes to pull data from our buffers
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    gl.enableVertexAttribArray(texcoordLocation);
    gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

    // 创建一个正交投影矩阵
    var matrix = m4.orthographic(0, gl.canvas.width, gl.canvas.height, 0, -1, 1);

    matrix = m4.multiply(matrix, matrixStack.getCurrentMatrix());

    matrix = m4.translate(matrix, dstX, dstY, 0);

    matrix = m4.scale(matrix, dstWidth, dstHeight, 1);

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // Because texture coordinates go from 0 to 1
    // and because our texture coordinates are already a unit quad
    // we can select an area of the texture by scaling the unit quad
    // down
    var texMatrix = m4.translation(srcX / texWidth, srcY / texHeight, 0);
    texMatrix = m4.scale(texMatrix, srcWidth / texWidth, srcHeight / texHeight, 1);

    // Set the texture matrix.
    gl.uniformMatrix4fv(textureMatrixLocation, false, texMatrix);

    // Tell the shader to get the texture from texture unit 0
    gl.uniform1i(textureLocation, 0);

    // draw the quad (2 triangles, 6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
}
main();
