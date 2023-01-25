'use strict';

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById('canvas');
  const gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 创建三种几何体的绘制信息
  const sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(gl, 10, 12, 6);
  const cubeBufferInfo = primitives.createCubeWithVertexColorsBufferInfo(gl, 20);
  const coneBufferInfo = primitives.createTruncatedConeWithVertexColorsBufferInfo(
    gl,
    10,
    0,
    20,
    12,
    1,
    true,
    false,
  );

  const shapes = [sphereBufferInfo, cubeBufferInfo, coneBufferInfo];

  // 设置两个着色器使用的着色器对
  const programInfo = webglUtils.createProgramInfo(gl, ['3d-vertex-shader', '3d-fragment-shader']);
  const pickingProgramInfo = webglUtils.createProgramInfo(gl, ['pick-vertex-shader', 'pick-fragment-shader']);

  function degToRad(d) {
    return (d * Math.PI) / 180;
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function eMod(x, n) {
    return x >= 0 ? x % n : (n - (-x % n)) % n;
  }

  const fieldOfViewRadians = degToRad(60);

  const objectsToDraw = [];
  const objects = [];

  // 为每个对象制作对应的信息
  const baseHue = rand(0, 360);
  const numObjects = 200;
  for (let ii = 0; ii < numObjects; ++ii) {
    const id = ii + 1;
    const object = {
      uniforms: {
        // 颜色信息
        u_colorMult: chroma.hsv(eMod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
        u_matrix: m4.identity(),
        u_id: [
          ((id >> 0) & 0xff) / 0xff,
          ((id >> 8) & 0xff) / 0xff,
          ((id >> 16) & 0xff) / 0xff,
          ((id >> 24) & 0xff) / 0xff,
        ],
      },
      translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
      xRotationSpeed: rand(0.8, 1.2),
      yRotationSpeed: rand(0.8, 1.2),
    };
    objects.push(object);
    objectsToDraw.push({
      programInfo,
      bufferInfo: shapes[ii % shapes.length],
      uniforms: object.uniforms,
    });
  }

  // 创建要渲染的纹理
  const targetTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // 创建一个深度渲染缓冲区
  const depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);

  function setFramebufferAttachmentSizes(width, height) {
    gl.bindTexture(gl.TEXTURE_2D, targetTexture);
    // 定义级别0的大小和格式
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;
    const data = null;
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, format, type, data);

    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
  }

  // 创建并绑定帧缓冲区
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);

  // 附加纹理作为第一个颜色附件
  const attachmentPoint = gl.COLOR_ATTACHMENT0;
  const level = 0;
  gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level);

  // 制作一个深度缓冲区，大小与 targetTexture 相同
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

  function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
    let matrix = m4.translate(viewProjectionMatrix, translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, xRotation);
    return m4.yRotate(matrix, yRotation);
  }

  requestAnimationFrame(drawScene);

  function drawObjects(objectsToDraw, overrideProgramInfo) {
    objectsToDraw.forEach(function (object) {
      const programInfo = overrideProgramInfo || object.programInfo;
      const { bufferInfo } = object;

      gl.useProgram(programInfo.program);

      // 设置所有需要的属性
      webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);

      // 设置全局变量
      webglUtils.setUniforms(programInfo, object.uniforms);

      // 进行绘制
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });
  }

  // mouseX 和 mouseY 表示鼠标相对于画布的相对位置
  let mouseX = -1;
  let mouseY = -1;
  // 用来进行颜色的恢复
  let oldPickNdx = -1;
  let oldPickColor;
  let frameCount = 0;

  // 绘制画布
  function drawScene(time) {
    time *= 0.0005;
    ++frameCount;

    if (webglUtils.resizeCanvasToDisplaySize(gl.canvas)) {
      // 调整画布的大小, 匹配帧缓冲区
      setFramebufferAttachmentSizes(gl.canvas.width, gl.canvas.height);
    }

    // 计算透视矩阵
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // 计算相机矩阵
    const cameraPosition = [0, 0, 100];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // 获取视图矩阵
    const viewMatrix = m4.inverse(cameraMatrix);

    const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // 计算每个对象的矩阵
    objects.forEach(function (object) {
      object.uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        object.translation,
        object.xRotationSpeed * time,
        object.yRotationSpeed * time,
      );
    });

    // ------ 将对象绘制到纹理上 --------

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // 清除画布和深度缓冲区
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawObjects(objectsToDraw, pickingProgramInfo);

    // ------ 获取我们鼠标所在位置的画布像素的颜色, 并且读取它

    const pixelX = (mouseX * gl.canvas.width) / gl.canvas.clientWidth;
    const pixelY = gl.canvas.height - (mouseY * gl.canvas.height) / gl.canvas.clientHeight - 1;
    const data = new Uint8Array(4);
    // 读取像素的方法
    gl.readPixels(
      pixelX, // x
      pixelY, // y
      1, // width
      1, // height
      gl.RGBA, // format
      gl.UNSIGNED_BYTE, // type
      data, // 获取最后读取到像素的结果
    ); // typed array to hold result
    const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24);

    // restore the object's color
    if (oldPickNdx >= 0) {
      const object = objects[oldPickNdx];
      object.uniforms.u_colorMult = oldPickColor;
      oldPickNdx = -1;
    }

    // 高亮当前鼠标所在位置的物体
    if (id > 0) {
      const pickNdx = id - 1;
      oldPickNdx = pickNdx;
      const object = objects[pickNdx];
      oldPickColor = object.uniforms.u_colorMult;
      //   改变颜色
      object.uniforms.u_colorMult = frameCount & 0x8 ? [1, 0, 0, 1] : [1, 1, 0, 1];
    }

    // ------ 将对象绘制到画布上

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    drawObjects(objectsToDraw);

    requestAnimationFrame(drawScene);
  }

  // 添加鼠标的监听事件
  gl.canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
}

main();
