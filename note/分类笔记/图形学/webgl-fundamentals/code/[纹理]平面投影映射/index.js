// 设置
const settings = {
  cameraX: 2.75,
  cameraY: 5,
  posX: 2.5,
  posY: 4.8,
  posZ: 4.3,
  targetX: 2.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 1,
  projHeight: 1,
  perspective: true,
  fieldOfView: 45,
};

function degToRad(d) {
  return (d * Math.PI) / 180;
}

function main() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 设置着色器代码
  // 编译着色器程序
  const textureProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  const colorProgramInfo = webglUtils.createProgramInfo(gl, ['color-vertex-shader', 'color-fragment-shader']);

  // 创建球的几何信息
  const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1, // radius
    12, // subdivisions around
    6, // subdivisions down
  );
  // 创建平面的几何信息
  const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20, // width
    20, // height
    1, // subdivisions across
    1, // subdivisions down
  );
  const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
    position: [-1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1],
    indices: [
      0, 1, 1, 3, 3, 2, 2, 0,

      4, 5, 5, 7, 7, 6, 6, 4,

      0, 4, 1, 5, 3, 7, 2, 6,
    ],
  });

  // 创建一个8x8的棋盘纹理
  // 创建纹理
  const checkerboardTexture = gl.createTexture();
  // 绑定纹理
  gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
  // 创建纹理数据
  gl.texImage2D(
    gl.TEXTURE_2D,
    0, // mip level
    gl.LUMINANCE, // internal format
    8, // width
    8, // height
    0, // border
    gl.LUMINANCE, // format
    gl.UNSIGNED_BYTE, // type
    new Uint8Array([
      // data
      0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xff,
      0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xff, 0xcc,
      0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xff, 0xcc, 0xff,
      0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff, 0xcc, 0xff,
    ]),
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  const fieldOfViewRadians = degToRad(60);

  // 加载一个图片纹理
  function loadImageTexture(url) {
    // 创建一个纹理
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // 用一个 1x1 蓝色像素填充该纹理
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
    // 异步加载一张图片
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function () {
      // 现在图片加载完了，把它拷贝到纹理中
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      // 假设该纹理的宽高是 2 的整次幂
      gl.generateMipmap(gl.TEXTURE_2D);
      render();
    });
    return texture;
  }

  // 创建图片纹理
  const imageTexture = loadImageTexture('../assets/f-texture.png');

  // 创建纹理变量
  const planeUniforms = {
    u_colorMult: [0.5, 0.5, 1, 1], // lightblue
    u_texture: checkerboardTexture,
    u_world: m4.translation(0, 0, 0),
  };
  const sphereUniforms = {
    u_colorMult: [1, 0.5, 0.5, 1], // pink
    u_texture: checkerboardTexture,
    u_world: m4.translation(2, 3, 4),
  };

  // 绘制场景
  function drawScene(projectionMatrix, cameraMatrix) {
    // 从相机矩阵创建视图矩阵
    const viewMatrix = m4.inverse(cameraMatrix);

    let textureWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ], // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0], // up
    );

    const textureProjectionMatrix = settings.perspective
      ? m4.perspective(
          degToRad(settings.fieldOfView),
          settings.projWidth / settings.projHeight,
          0.1, // near
          200,
        ) // far
      : m4.orthographic(
          -settings.projWidth / 2, // left
          settings.projWidth / 2, // right
          -settings.projHeight / 2, // bottom
          settings.projHeight / 2, // top
          0.1, // near
          200,
        ); // far

    let textureMatrix = m4.identity();
    textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
    // 使用这个世界矩阵的逆矩阵来创建
    // 一个矩阵，该矩阵会变换其他世界坐标
    // 为相对于这个空间的坐标。
    textureMatrix = m4.multiply(textureMatrix, m4.inverse(textureWorldMatrix));

    gl.useProgram(textureProgramInfo.program);

    // 设置几何体信息
    webglUtils.setUniforms(textureProgramInfo, {
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      // 纹理矩阵
      u_textureMatrix: textureMatrix,
      // 投影的纹理数据
      u_projectedTexture: imageTexture,
    });

    // ------ Draw the sphere --------

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo);

    // Set the uniforms unique to the sphere
    webglUtils.setUniforms(textureProgramInfo, sphereUniforms);

    // calls gl.drawArrays or gl.drawElements
    webglUtils.drawBufferInfo(gl, sphereBufferInfo);

    // ------ Draw the plane --------

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, textureProgramInfo, planeBufferInfo);

    // Set the uniforms unique to the plane
    webglUtils.setUniforms(textureProgramInfo, planeUniforms);

    // calls gl.drawArrays or gl.drawElements
    webglUtils.drawBufferInfo(gl, planeBufferInfo);

    // ------ 绘制线框立方体 ------

    gl.useProgram(colorProgramInfo.program);

    // 设置所有需要的 attributes
    webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);

    // 调整立方体使其匹配该投影
    const mat = m4.multiply(textureWorldMatrix, m4.inverse(textureProjectionMatrix));

    // 设置我们计算出来的 unifroms
    webglUtils.setUniforms(colorProgramInfo, {
      u_color: [0, 0, 0, 1],
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_world: mat,
    });

    // 调用 gl.drawArrays 或者 gl.drawElements
    webglUtils.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
  }

  function render() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    const cameraPosition = [settings.cameraX, settings.cameraY, 7];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    drawScene(projectionMatrix, cameraMatrix);
  }
  render();
}

main();
