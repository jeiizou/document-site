function main() {
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector('#canvas');
  var gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 创建着色器程序

  // 环境映射着色器程序
  const envmapProgramInfo = webglUtils.createProgramInfo(gl, [
    'envmap-vertex-shader',
    'envmap-fragment-shader',
  ]);
  // 天空盒着色器程序
  const skyboxProgramInfo = webglUtils.createProgramInfo(gl, [
    'skybox-vertex-shader',
    'skybox-fragment-shader',
  ]);

  // 创建缓冲, 并且填充顶点数据
  const cubeBufferInfo = primitives.createCubeBufferInfo(gl, 1);
  const quadBufferInfo = primitives.createXYQuadBufferInfo(gl);

  // 创建纹理
  const texture = gl.createTexture();
  // 指定纹理为立方体纹理
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  // 指定各个纹理的类型
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

    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // 立即设置每个面的参数的默认渲染参数, 以便马上开始渲染
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    // 异步加载一张图片
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function () {
      // 等待图片加载完成, 绑定的纹理上
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      // 重新渲染
      gl.texImage2D(target, level, internalFormat, format, type, image);
      // 生成
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  // 设定初始时间
  var then = 0;

  requestAnimationFrame(drawScene);

  // 绘制场景
  function drawScene(time) {
    // 转换时间
    time *= 0.001;
    // 计算时间的插值
    var deltaTime = time - then;
    // 更新时间
    then = time;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // 重置视口
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // 清理缓冲
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 计算投影矩阵
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // camera going in circle 2 units from origin looking at origin
    var cameraPosition = [Math.cos(time * 0.1) * 2, 0, Math.sin(time * 0.1) * 2];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    // Rotate the cube around the x axis
    var worldMatrix = m4.xRotation(time * 0.11);

    // We only care about direciton so remove the translation
    var viewDirectionMatrix = m4.copy(viewMatrix);
    viewDirectionMatrix[12] = 0;
    viewDirectionMatrix[13] = 0;
    viewDirectionMatrix[14] = 0;

    var viewDirectionProjectionMatrix = m4.multiply(projectionMatrix, viewDirectionMatrix);
    var viewDirectionProjectionInverseMatrix = m4.inverse(viewDirectionProjectionMatrix);

    // 绘制立方体
    gl.depthFunc(gl.LESS); // use the default depth test
    gl.useProgram(envmapProgramInfo.program);
    webglUtils.setBuffersAndAttributes(gl, envmapProgramInfo, cubeBufferInfo);
    webglUtils.setUniforms(envmapProgramInfo, {
      u_world: worldMatrix,
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_texture: texture,
      u_worldCameraPosition: cameraPosition,
    });
    webglUtils.drawBufferInfo(gl, cubeBufferInfo);

    // 绘制天空盒
    // let our quad pass the depth test at 1.0
    gl.depthFunc(gl.LEQUAL);

    gl.useProgram(skyboxProgramInfo.program);
    webglUtils.setBuffersAndAttributes(gl, skyboxProgramInfo, quadBufferInfo);
    webglUtils.setUniforms(skyboxProgramInfo, {
      u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
      u_skybox: texture,
    });
    webglUtils.drawBufferInfo(gl, quadBufferInfo);

    requestAnimationFrame(drawScene);
  }
}

// Fill the buffer with the values that define a quad.
function setGeometry(gl) {
  // prettier-ignore
  var positions = new Float32Array(
      [
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

main();
