var Node = function () {
  this.children = [];
  this.localMatrix = m4.identity();
  this.worldMatrix = m4.identity();
};

Node.prototype.setParent = function (parent) {
  // 从父节点移除
  if (this.parent) {
    var ndx = this.parent.children.indexOf(this);
    if (ndx >= 0) {
      this.parent.children.splice(ndx, 1);
    }
  }

  // 增加到父节点上
  if (parent) {
    parent.children.push(this);
  }
  this.parent = parent;
};

Node.prototype.updateWorldMatrix = function (parentWorldMatrix) {
  if (parentWorldMatrix) {
    // 传入一个矩阵计算出世界矩阵并且存入到`this.worldMatrix`
    m4.multiply(parentWorldMatrix, this.localMatrix, this.worldMatrix);
  } else {
    // 没有矩阵传入, 直接将局部矩阵烤白到世界矩阵
    m4.copy(this.localMatrix, this.worldMatrix);
  }

  // 计算所有子节点
  var worldMatrix = this.worldMatrix;
  this.children.forEach(function (child) {
    child.updateWorldMatrix(worldMatrix);
  });
};

function degToRad(d) {
  return (d * Math.PI) / 180;
}

function resize(gl) {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function main() {
  // 初始化上下文
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector('#canvas');
  var gl = canvas.getContext('webgl');
  if (!gl) {
    return;
  }

  // 创建着色器对象
  var programInfo = webglUtils.createProgramInfo(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  // 球体的缓存数据信息
  const sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(gl, 10, 12, 6);

  var fieldOfViewRadians = degToRad(60);

  var objectsToDraw = [];
  var objects = [];

  // 创建场景图
  //   solarSystem
  //     |    |
  //     |   sun
  //     |
  //   earthOrbit
  //     |    |
  //     |  earth
  //     |
  //   moonOrbit
  //        |
  //       moon
  // 创建 系统节点
  var solarSystemNode = new Node(); // 太阳系统
  var earthOrbitNode = new Node(); // 地球系统
  earthOrbitNode.localMatrix = m4.translation(100, 0, 0); // earth orbit 100 units from the sun
  var moonOrbitNode = new Node(); // 月球系统
  moonOrbitNode.localMatrix = m4.translation(30, 0, 0); // moon 20 units from the earth

  // 创建太阳节点
  let sunNode = new Node();
  // 设置太阳在中心节点
  sunNode.localMatrix = m4.scaling(5, 5, 5);
  // 绘制需要的相关信息
  sunNode.drawInfo = {
    // 绘制需要的全局变量
    uniforms: {
      u_colorOffset: [0.6, 0.6, 0, 1], // yellow
      u_colorMult: [0.4, 0.4, 0, 1],
    },
    // 绘制需要的着色器程序
    programInfo: programInfo,
    // 绘制需要的顶点数据信息
    bufferInfo: sphereBufferInfo,
  };

  // 创建地球节点, 相关数据含义同上
  var earthNode = new Node();
  // 让地球变为两倍大小
  earthNode.localMatrix = m4.scaling(2, 2, 2);
  earthNode.drawInfo = {
    uniforms: {
      u_colorOffset: [0.2, 0.5, 0.8, 1], // blue-green
      u_colorMult: [0.8, 0.5, 0.2, 1],
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo,
  };

  var moonNode = new Node();
  moonNode.localMatrix = m4.scaling(0.4, 0.4, 0.4);
  moonNode.drawInfo = {
    uniforms: {
      u_colorOffset: [0.6, 0.6, 0.6, 1], // gray
      u_colorMult: [0.1, 0.1, 0.1, 1],
    },
    programInfo: programInfo,
    bufferInfo: sphereBufferInfo,
  };

  // 连接各个节点
  earthOrbitNode.setParent(solarSystemNode);
  moonOrbitNode.setParent(earthOrbitNode);

  sunNode.setParent(solarSystemNode);
  earthNode.setParent(earthOrbitNode);
  moonNode.setParent(moonOrbitNode);

  // 要绘制的是三个对象
  var objects = [sunNode, earthNode, moonNode];

  // 绘制对象的相关信息
  var objectsToDraw = [sunNode.drawInfo, earthNode.drawInfo, moonNode.drawInfo];

  requestAnimationFrame(drawScene);

  function drawScene(time) {
    time *= 0.0005;

    resize(gl);

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, -200, 0];
    var target = [0, 0, 0];
    var up = [0, 0, 1];
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // 旋转日地系统
    m4.multiply(m4.yRotation(0.01), earthOrbitNode.localMatrix, earthOrbitNode.localMatrix);
    // 旋转地月系统
    m4.multiply(m4.yRotation(0.01), moonOrbitNode.localMatrix, moonOrbitNode.localMatrix);
    // 旋转地球
    m4.multiply(m4.yRotation(0.05), earthNode.localMatrix, earthNode.localMatrix);
    // 旋转月亮
    m4.multiply(m4.yRotation(-0.01), moonNode.localMatrix, moonNode.localMatrix);

    // 更新太阳的世界矩阵
    solarSystemNode.updateWorldMatrix();

    // 更新每个对象的绘制矩阵
    objects.forEach(function (object) {
      object.drawInfo.uniforms.u_matrix = m4.multiply(viewProjectionMatrix, object.worldMatrix);
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

        // We have to rebind buffers when changing programs because we
        // only bind buffers the program uses. So if 2 programs use the same
        // bufferInfo but the 1st one uses only positions the when the
        // we switch to the 2nd one some of the attributes will not be on.
        bindBuffers = true;
      }

      // Setup all the needed attributes.
      if (bindBuffers || bufferInfo !== lastUsedBufferInfo) {
        lastUsedBufferInfo = bufferInfo;
        webglUtils.setBuffersAndAttributes(gl, programInfo, bufferInfo);
      }

      // Set the uniforms.
      webglUtils.setUniforms(programInfo, object.uniforms);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);
    });

    requestAnimationFrame(drawScene);
  }
}

main();
