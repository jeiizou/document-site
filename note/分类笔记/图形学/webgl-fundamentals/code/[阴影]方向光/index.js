// 参数控制
const settings = {
  cameraX: 6,
  cameraY: 12,
  posX: 2.5,
  posY: 4.8,
  posZ: 7,
  targetX: 3.5,
  targetY: 0,
  targetZ: 3.5,
  projWidth: 10,
  projHeight: 10,
  perspective: false,
  fieldOfView: 120,
  bias: -0.006,
};

// 工具相关
function degToRad(d) {
  return (d * Math.PI) / 180;
}

// 主流程
function main() {
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector('#canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 使用深度纹理扩展
  const ext = gl.getExtension('WEBGL_depth_texture');
  if (!ext) {
    return alert('need WEBGL_depth_texture'); // eslint-disable-line
  }

  // 创建着色器程序
  const textureProgramInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
  const colorProgramInfo = webglUtils.createProgramInfo(gl, ['color-vertex-shader', 'color-fragment-shader']);

  // 创建球体相关信息
  const sphereBufferInfo = primitives.createSphereBufferInfo(
    gl,
    1, // radius
    32, // subdivisions around
    24, // subdivisions down
  );

  // 创建平面相关信息
  const planeBufferInfo = primitives.createPlaneBufferInfo(
    gl,
    20, // width
    20, // height
    1, // subdivisions across
    1, // subdivisions down
  );

  // 创建几何体相关信息
  const cubeBufferInfo = primitives.createCubeBufferInfo(
    gl,
    2, // size
  );

  // 创建线框几何相关信息
  const cubeLinesBufferInfo = webglUtils.createBufferInfoFromArrays(gl, {
    position: [-1, -1, -1, 1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1],
    indices: [
      0, 1, 1, 3, 3, 2, 2, 0,

      4, 5, 5, 7, 7, 6, 6, 4,

      0, 4, 1, 5, 3, 7, 2, 6,
    ],
  });

  // 创建 8x8 的数字纹理
  const checkerboardTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
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

  // 创建深度纹理和一个帧缓冲, 然后将该纹理作为`DEPTH_ATTACHMENT`附加到帧缓冲上

  const depthTexture = gl.createTexture();
  const depthTextureSize = 512;
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.texImage2D(
    gl.TEXTURE_2D, // target
    0, // mip level
    gl.DEPTH_COMPONENT, // internal format
    depthTextureSize, // width
    depthTextureSize, // height
    0, // border
    gl.DEPTH_COMPONENT, // format
    gl.UNSIGNED_INT, // type
    null,
  ); // data
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // 深度帧缓存
  const depthFramebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
  // 绑定纹理数据到帧缓冲
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, // target
    gl.DEPTH_ATTACHMENT, // attachment point
    gl.TEXTURE_2D, // texture target
    depthTexture, // texture
    0,
  ); // mip level

  // 创建与深度纹理大小相同的颜色纹理, 然后作为一个`COLOR_ATTACHMENT0`附加到帧缓冲上. 即便我们后面不会使用它
  const unusedTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, unusedTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    depthTextureSize,
    depthTextureSize,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // 将其附加到帧缓冲上
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER, // target
    gl.COLOR_ATTACHMENT0, // attachment point
    gl.TEXTURE_2D, // texture target
    unusedTexture, // texture
    0,
  ); // mip level

  const fieldOfViewRadians = degToRad(60);

  // Uniforms for each object.
  const planeUniforms = {
    u_colorMult: [0.5, 0.5, 1, 1], // lightblue
    u_color: [1, 0, 0, 1],
    u_texture: checkerboardTexture,
    u_world: m4.translation(0, 0, 0),
  };
  const sphereUniforms = {
    u_colorMult: [1, 0.5, 0.5, 1], // pink
    u_color: [0, 0, 1, 1],
    u_texture: checkerboardTexture,
    u_world: m4.translation(2, 3, 4),
  };
  const cubeUniforms = {
    u_colorMult: [0.5, 1, 0.5, 1], // lightgreen
    u_color: [0, 0, 1, 1],
    u_texture: checkerboardTexture,
    u_world: m4.translation(3, 1, 0),
  };

  function drawScene(projectionMatrix, cameraMatrix, textureMatrix, lightWorldMatrix, programInfo) {
    // 从相机矩阵中创建一个视图矩阵
    const viewMatrix = m4.inverse(cameraMatrix);

    gl.useProgram(programInfo.program);

    // 设置对于球体和平面都是一样的 uniforms
    // 注意: 在着色器中, 任何没有对应的 uniforms 的值都会被忽略
    webglUtils.setUniforms(programInfo, {
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_bias: settings.bias,
      u_textureMatrix: textureMatrix,
      u_projectedTexture: depthTexture,
      u_reverseLightDirection: lightWorldMatrix.slice(8, 11),
    });

    // ------ 绘制球体 --------

    // 设置所有需要的 attributes
    webglUtils.setBuffersAndAttributes(gl, programInfo, sphereBufferInfo);

    // 设置球体特有的 uniforms
    webglUtils.setUniforms(programInfo, sphereUniforms);

    // 调用 gl.drawArrays 或 gl.drawElements
    webglUtils.drawBufferInfo(gl, sphereBufferInfo);

    // ------ 绘制立方体 --------

    // 设置所有需要的 attributes
    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);

    // 设置我们刚刚计算的 uniforms
    webglUtils.setUniforms(programInfo, cubeUniforms);

    // 调用 gl.drawArrays 或 gl.drawElements
    webglUtils.drawBufferInfo(gl, cubeBufferInfo);

    // ------ 绘制平面 --------

    // Setup all the needed attributes.
    webglUtils.setBuffersAndAttributes(gl, programInfo, planeBufferInfo);

    // Set the uniforms unique to the cube
    webglUtils.setUniforms(programInfo, planeUniforms);

    // calls gl.drawArrays or gl.drawElements
    webglUtils.drawBufferInfo(gl, planeBufferInfo);
  }

  function render() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // 首先从光源的角度绘制一次
    const lightWorldMatrix = m4.lookAt(
      [settings.posX, settings.posY, settings.posZ], // position
      [settings.targetX, settings.targetY, settings.targetZ], // target
      [0, 1, 0], // up
    );

    // 光线的投影矩阵
    const lightProjectionMatrix = settings.perspective
      ? m4.perspective(
          degToRad(settings.fieldOfView),
          settings.projWidth / settings.projHeight,
          0.5, // near
          10,
        ) // far
      : m4.orthographic(
          -settings.projWidth / 2, // left
          settings.projWidth / 2, // right
          -settings.projHeight / 2, // bottom
          settings.projHeight / 2, // top
          0.5, // near
          10,
        ); // far

    // 绘制深度纹理
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthFramebuffer);
    gl.viewport(0, 0, depthTextureSize, depthTextureSize);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 绘制几何体信息
    drawScene(lightProjectionMatrix, lightWorldMatrix, m4.identity(), lightWorldMatrix, colorProgramInfo);

    // 现在绘制场景到画布, 把深度纹理投影到场景内
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let textureMatrix = m4.identity();
    textureMatrix = m4.translate(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5);
    textureMatrix = m4.multiply(textureMatrix, lightProjectionMatrix);
    // 使用该世界矩阵的逆矩阵来创建一个 可以变换其他坐标为相对于这个世界空间 的矩阵
    textureMatrix = m4.multiply(textureMatrix, m4.inverse(lightWorldMatrix));

    // 计算投影矩阵
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // 使用 look at 计算相机的矩阵
    const cameraPosition = [settings.cameraX, settings.cameraY, 7];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    drawScene(projectionMatrix, cameraMatrix, textureMatrix, lightWorldMatrix, textureProgramInfo);

    // ------ Draw the frustum ------
    {
      const viewMatrix = m4.inverse(cameraMatrix);

      gl.useProgram(colorProgramInfo.program);

      // Setup all the needed attributes.
      webglUtils.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);

      // scale the cube in Z so it's really long
      // to represent the texture is being projected to
      // infinity
      const mat = m4.multiply(lightWorldMatrix, m4.inverse(lightProjectionMatrix));

      // Set the uniforms we just computed
      webglUtils.setUniforms(colorProgramInfo, {
        u_color: [1, 1, 1, 1],
        u_view: viewMatrix,
        u_projection: projectionMatrix,
        u_world: mat,
      });

      // calls gl.drawArrays or gl.drawElements
      webglUtils.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
    }
  }

  webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
    {
      type: 'slider',
      key: 'cameraX',
      min: -10,
      max: 10,
      change: render,
      precision: 2,
      step: 0.001,
    },
    {
      type: 'slider',
      key: 'cameraY',
      min: 1,
      max: 20,
      change: render,
      precision: 2,
      step: 0.001,
    },
    {
      type: 'slider',
      key: 'posX',
      min: -10,
      max: 10,
      change: render,
      precision: 2,
      step: 0.001,
    },
    {
      type: 'slider',
      key: 'posY',
      min: 1,
      max: 20,
      change: render,
      precision: 2,
      step: 0.001,
    },
    {
      type: 'slider',
      key: 'posZ',
      min: 1,
      max: 20,
      change: render,
      precision: 2,
      step: 0.001,
    },
    {
      type: 'slider',
      key: 'targetX',
      min: -10,
      max: 10,
      change: render,
      precision: 2,
      step: 0.001,
    },
    {
      type: 'slider',
      key: 'targetY',
      min: 0,
      max: 20,
      change: render,
      precision: 2,
      step: 0.001,
    },
    {
      type: 'slider',
      key: 'targetZ',
      min: -10,
      max: 20,
      change: render,
      precision: 2,
      step: 0.001,
    },
    {
      type: 'slider',
      key: 'projWidth',
      min: 0,
      max: 2,
      change: render,
      precision: 2,
      step: 0.001,
    },
    {
      type: 'slider',
      key: 'projHeight',
      min: 0,
      max: 2,
      change: render,
      precision: 2,
      step: 0.001,
    },
    { type: 'checkbox', key: 'perspective', change: render },
    {
      type: 'slider',
      key: 'fieldOfView',
      min: 1,
      max: 179,
      change: render,
    },
    {
      type: 'slider',
      key: 'bias',
      min: -0.01,
      max: 0.00001,
      change: render,
      precision: 4,
      step: 0.0001,
    },
  ]);

  render();
}

main();
