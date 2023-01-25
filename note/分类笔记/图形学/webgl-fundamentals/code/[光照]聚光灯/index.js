function radToDeg(r) {
  return (r * 180) / Math.PI;
}

function degToRad(d) {
  return (d * Math.PI) / 180;
}

function init() {
  /** @type {HTMLCanvasElement} */
  let canvas = document.querySelector('#canvas');
  gl = canvas.getContext('webgl');
  if (!gl) {
    throw Error('not support webgl');
  }

  // 初始化着色程序
  let program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-3d', 'fragment-shader-3d']);
  gl.program = program;

  // 使用当前的着色器程序
  gl.useProgram(gl.program);

  // 设置视窗口位置
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  // 设置视口
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // 开启单面绘制
  gl.enable(gl.CULL_FACE);
  // 开启深度缓冲区
  gl.enable(gl.DEPTH_TEST);
}

function clear() {
  // 清理画布
  gl.clearColor(0, 0, 0, 0);
  // 清理画布和深度缓冲
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function setAttributes(name, data, { size, type = gl.FLOAT, normalize = false, stride = 0, offset = 0 }) {
  // 获取位置
  let location = gl.getAttribLocation(gl.program, name);
  // 创建buffer
  let buffer = gl.createBuffer();
  // 绑定buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  // 给 buffer 写入数据
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // 激活属性
  gl.enableVertexAttribArray(location);
  // 设定读取数据的格式
  gl.vertexAttribPointer(location, size, type, normalize, stride, offset);
}

function setUniforms(name, { values, method = 'uniform2f' }) {
  let location = gl.getUniformLocation(gl.program, name);
  gl[method](location, ...values);
}

function main() {
  init();

  // 传递顶点坐标
  setAttributes('a_position', getFPosition(), {
    size: 3,
  });
  // 传递法向量数据
  setAttributes('a_normal', getNormals(), {
    size: 3,
  });
  // 传递颜色值
  setUniforms('u_color', {
    values: [[0.2, 1, 0.2, 1]],
    method: 'uniform4fv',
  });

  // 设置高光反射的亮度
  setUniforms('u_shininess', {
    values: [150],
    method: 'uniform1f',
  });

  // 聚光灯的范围
  let limit = degToRad(10);
  var innerLimit = degToRad(10);
  var outerLimit = degToRad(20);
  setUniforms('u_innerLimit', {
    values: [Math.cos(innerLimit)],
    method: 'uniform1f',
  });
  setUniforms('u_outerLimit', {
    values: [Math.cos(outerLimit)],
    method: 'uniform1f',
  });

  var fieldOfViewRadians = degToRad(60);
  // 视椎体矩阵 设置
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var zNear = 1;
  var zFar = 2000;
  // 投影矩阵
  var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

  // 传递 点光源的位置
  const lightPosition = [40, 60, 120];
  setUniforms('u_lightWorldPosition', {
    values: [lightPosition],
    method: 'uniform3fv',
  });

  // 相机矩阵设置
  var camera = [100, 150, 200];
  var target = [0, 35, 0];
  var up = [0, 1, 0];
  var cameraMatrix = m4.lookAt(camera, target, up);
  // 设置相机的位置
  setUniforms('u_viewWorldPosition', {
    values: [camera],
    method: 'uniform3fv',
  });

  let lmat = m4.lookAt(lightPosition, target, up);
  lmat = m4.multiply(m4.xRotation(0), lmat);
  lmat = m4.multiply(m4.yRotation(0), lmat);
  // 注意, 这里取负.
  lightDirection = [-lmat[8], -lmat[9], -lmat[10]];

  // 光线位置
  setUniforms('u_lightDirection', {
    values: [lightDirection],
    method: 'uniform3fv',
  });

  // 从相机矩阵计算 视图矩阵
  var viewMatrix = m4.inverse(cameraMatrix);

  // 计算出一个 观察投影矩阵
  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  draw(viewProjectionMatrix);
}

var fRotationRadians = 0;
function draw(viewProjectionMatrix) {
  fRotationRadians = (fRotationRadians + 0.01) % 360;

  // 旋转矩阵
  var worldMatrix = m4.yRotation(fRotationRadians);

  // 经过旋转的 观察投影矩阵
  var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
  // 逆 旋转矩阵
  var worldInverseMatrix = m4.inverse(worldMatrix);
  // 反转逆旋转矩阵
  var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

  setUniforms('u_world', {
    values: [false, worldMatrix],
    method: 'uniformMatrix4fv',
  });
  setUniforms('u_worldViewProjection', {
    values: [false, worldViewProjectionMatrix],
    method: 'uniformMatrix4fv',
  });
  setUniforms('u_worldInverseTranspose', {
    values: [false, worldInverseTransposeMatrix],
    method: 'uniformMatrix4fv',
  });

  gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);

  requestAnimationFrame(() => {
    draw(viewProjectionMatrix);
  });
}

main();
