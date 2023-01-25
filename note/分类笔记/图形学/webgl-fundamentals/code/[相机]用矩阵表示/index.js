// 工具方法
function radToDeg(r) {
  return (r * 180) / Math.PI;
}

function degToRad(d) {
  return (d * Math.PI) / 180;
}

// 计算叉乘
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

// 向量相减
function subtractVectors(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

// 单位化向量
function normalize(v) {
  var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  // 确定不会除以 0
  if (length > 0.00001) {
    return [v[0] / length, v[1] / length, v[2] / length];
  } else {
    return [0, 0, 0];
  }
}

// 初始化上下文和着色器
function init() {
  let canvas = document.querySelector('#canvas');
  gl = canvas.getContext('webgl');
  if (!gl) {
    throw Error('not support webgl');
  }

  let program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-3d', 'fragment-shader-3d']);

  gl.program = program;

  // 使用当前的着色器程序
  gl.useProgram(gl.program);

  // 设置视窗口位置
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  // 设置视口
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);
}

// 清理画布
function clear() {
  gl.clearColor(0, 0, 0, 0);
  // 清空颜色缓冲区和深度缓冲区
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

// 设置一个属性
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

// 设置一个全局变量
function setUniforms(name, { values, method = 'uniform2f' }) {
  let location = gl.getUniformLocation(gl.program, name);
  gl[method](location, ...values);
}

let deg = 0;

function main() {
  init();

  setAttributes('a_position', setGeometry(gl), {
    size: 3,
  });

  setAttributes('a_color', setColors(gl), {
    size: 3,
    normalize: true,
    type: gl.UNSIGNED_BYTE,
  });

  draw();
}

function draw() {
  deg += 0.5 % 360;

  // F 的数量
  let numFs = 5;
  let radius = 200;

  var cameraAngleRadians = degToRad(deg);
  var fieldOfViewRadians = degToRad(120);

  // 计算视椎体矩阵
  var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  var zNear = 1;
  var zFar = 2000;
  var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

  // 计算第一个F的位置
  let fPosition = [radius, 0, 0];

  // 计算相机在圆上的位置矩阵
  var cameraMatrix = m4.yRotation(cameraAngleRadians);
  cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);

  // 获得矩阵中相机的位置
  var cameraPosition = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]];

  var up = [0, 1, 0];

  // 计算相机的朝向矩阵
  var cameraMatrix = m4.lookAt(cameraPosition, fPosition, up);

  // 通过相机矩阵获得视图矩阵
  var viewMatrix = m4.inverse(cameraMatrix);

  var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  for (var ii = 0; ii < numFs; ++ii) {
    var angle = (ii * Math.PI * 2) / numFs;
    var x = Math.cos(angle) * radius;
    var y = Math.sin(angle) * radius;

    // starting with the view projection matrix
    // compute a matrix for the F
    var matrix = m4.translate(viewProjectionMatrix, x, 0, y);

    // Set the matrix.
    setUniforms('u_matrix', {
      values: [false, matrix],
      method: 'uniformMatrix4fv',
    });

    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
  }

  requestAnimationFrame(draw);
}

main();
