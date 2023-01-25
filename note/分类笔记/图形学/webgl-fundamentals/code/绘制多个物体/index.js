let gl;

function degToRad(d) {
  return (d * Math.PI) / 180;
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function emod(x, n) {
  return x >= 0 ? x % n : (n - (-x % n)) % n;
}

function resize() {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // Clear the canvas AND the depth buffer.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation) {
  var matrix = m4.translate(viewProjectionMatrix, translation[0], translation[1], translation[2]);
  matrix = m4.xRotate(matrix, xRotation);
  return m4.yRotate(matrix, yRotation);
}

function main() {
  /** @type {HTMLCanvasElement} */
  let canvas = document.querySelector('#canvas');
  gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 创建一个球体
  const sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(gl, 10, 12, 6);
  // 创建一个立方体
  const cubeBufferInfo = primitives.createCubeWithVertexColorsBufferInfo(gl, 20);
  // 创建一个椎体
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

  // 把对象放在数组中, 方便后面随机抽取
  var shapes = [sphereBufferInfo, cubeBufferInfo, coneBufferInfo];

  // 创建着色器程序
  let programInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  // 相机角度
  // let cameraAngleRadians = degToRad(0);
  // 物体的视觉角度
  let fieldOfViewRadians = degToRad(60);
  // 相机高度
  // let cameraHeight = 50;

  var objectsToDraw = [];
  var objects = [];
  var baseHue = rand(0, 360);
  var numObjects = 200;

  for (let ii = 0; ii < numObjects; ii++) {
    var object = {
      uniforms: {
        // 生成一个随机颜色
        u_colorMult: chroma.hsv(emod(baseHue + rand(0, 120), 360), rand(0.5, 1), rand(0.5, 1)).gl(),
        u_matrix: m4.identity(),
      },
      translation: [rand(-100, 100), rand(-100, 100), rand(-150, -50)],
      xRotationSpeed: rand(0.8, 1.2),
      yRotationSpeed: rand(0.8, 1.2),
    };
    objects.push(object);
    objectsToDraw.push({
      programInfo: programInfo,
      bufferInfo: shapes[ii % shapes.length],
      uniforms: object.uniforms,
    });
  }

  requestAnimationFrame(drawScene);

  function drawScene(time) {
    time *= 0.0005;
    resize();

    // 计算投影矩阵
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // 计算相机矩阵
    var cameraPosition = [0, 0, 100];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);
    // 根据相机矩阵计算视图矩阵
    var viewMatrix = m4.inverse(cameraMatrix);

    // 获取最终的视图投影矩阵
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // Compute the matrices for each object.
    objects.forEach(function (object) {
      object.uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        object.translation,
        object.xRotationSpeed * time,
        object.yRotationSpeed * time,
      );
    });

    var lastUsedProgramInfo = null;
    var lastUsedBufferInfo = null;

    objectsToDraw.forEach(function (object) {
      var programInfo = object.programInfo;
      var bufferInfo = object.bufferInfo;

      var bindBuffers = false;

      if (programInfo !== lastUsedProgramInfo) {
        lastUsedProgramInfo = programInfo;
        gl.useProgram(programInfo.program);

        // 更换程序后要重新绑定缓冲，因为只需要绑定程序要用的缓冲。
        // 如果两个程序使用相同的bufferInfo但是第一个只用位置数据，
        // 当我们从第一个程序切换到第二个时，有些属性就不存在。
        bindBuffers = true;
      }

      // 设置所需的属性
      if (bindBuffers || bufferInfo != lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }

      // 设置全局变量
      webglUtils.setUniforms(programInfo, object.uniforms);

      // 绘制
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

    requestAnimationFrame(drawScene);
  }
}

main();
