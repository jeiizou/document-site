function degToRad(d) {
  return (d * Math.PI) / 180;
}

function rand(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
}

function randInt(range) {
  return Math.floor(Math.random() * range);
}

function main() {
  // 初始化gl环境
  /** @type {HTMLCanvasElement} */
  let canvas = document.querySelector('#canvas');
  let gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }
  // 激活深度检测
  gl.enable(gl.DEPTH_TEST);

  // 一个简单的三角形
  let arrays = {
    // 顶点坐标
    position: {
      numComponents: 3,
      data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0],
    },
    // 纹理坐标
    texcoord: {
      numComponents: 2,
      data: [0, 0, 0, 1, 1, 0, 1, 1],
    },
    // 法向量
    normal: {
      numComponents: 3,
      data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
    },
    indices: { numComponents: 3, data: [0, 1, 2, 1, 2, 3] },
  };

  // 创建相应的缓冲对象
  let bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);

  // 创建着色器程序
  var program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
  // 全局变量设置器
  var uniformSetters = webglUtils.createUniformSetters(gl, program);
  // 属性设置器
  var attribSetters = webglUtils.createAttributeSetters(gl, program);

  var fieldOfViewRadians = degToRad(60);

  var uniformsThatAreTheSameForAllObjects = {
    u_lightWorldPos: [-50, 30, 100],
    u_viewInverse: m4.identity(),
    u_lightColor: [1, 1, 1, 1],
  };

  var uniformsThatAreComputedForEachObject = {
    u_worldViewProjection: m4.identity(),
    u_world: m4.identity(),
    u_worldInverseTranspose: m4.identity(),
  };

  var textures = [
    textureUtils.makeStripeTexture(gl, { color1: '#FFF', color2: '#CCC' }),
    textureUtils.makeCheckerTexture(gl, { color1: '#FFF', color2: '#CCC' }),
    textureUtils.makeCircleTexture(gl, { color1: '#FFF', color2: '#CCC' }),
  ];

  var objects = [];
  var numObjects = 300;
  var baseColor = rand(240);

  for (var ii = 0; ii < numObjects; ++ii) {
    objects.push({
      radius: rand(150),
      xRotation: rand(Math.PI * 2),
      yRotation: rand(Math.PI),
      materialUniforms: {
        u_colorMult: chroma.hsv(rand(baseColor, baseColor + 120), 0.5, 1).gl(),
        u_diffuse: textures[randInt(textures.length)],
        u_specular: [1, 1, 1, 1],
        u_shininess: rand(500),
        u_specularFactor: rand(1),
      },
    });
  }

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    time = time * 0.0001 + 5;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 计算投影矩阵
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // 用lookat的方式设置相机矩阵
    var cameraPosition = [0, 0, 100];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = m4.lookAt(
      cameraPosition,
      target,
      up,
      uniformsThatAreTheSameForAllObjects.u_viewInverse,
    );

    // 用相机矩阵的逆矩阵计算视图矩阵
    var viewMatrix = m4.inverse(cameraMatrix);
    // 投影矩阵 * 视图矩阵 得到最终的 视图投影矩阵
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);
    // 激活着色器程序
    gl.useProgram(program);

    // 设置所有需要的属性的值
    webglUtils.setBuffersAndAttributes(gl, attribSetters, bufferInfo);

    // 设置所有需要的全局变量的值
    webglUtils.setUniforms(uniformSetters, uniformsThatAreTheSameForAllObjects);

    // 绘制每一个三角形
    objects.forEach(function (object) {
      // 计算每一个三角形的位置, 根据时间进行位置的变化
      var worldMatrix = m4.xRotation(object.xRotation * time); // 绕 x 旋转
      worldMatrix = m4.yRotate(worldMatrix, object.yRotation * time); // 绕 y 旋转
      worldMatrix = m4.translate(worldMatrix, 0, 0, object.radius); //
      uniformsThatAreComputedForEachObject.u_world = worldMatrix;

      // 将变化叠加到最终要绘制的视图矩阵上
      m4.multiply(
        viewProjectionMatrix,
        worldMatrix,
        uniformsThatAreComputedForEachObject.u_worldViewProjection,
      );
      m4.transpose(m4.inverse(worldMatrix), uniformsThatAreComputedForEachObject.u_worldInverseTranspose);

      // 设置我们的全局标签
      webglUtils.setUniforms(uniformSetters, uniformsThatAreComputedForEachObject);

      // 设置针对这个对象的特殊的矩阵数据
      webglUtils.setUniforms(uniformSetters, object.materialUniforms);

      // 绘制三角形
      gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);
    });

    requestAnimationFrame(drawScene);
  }
}

main();
