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

function radToDeg(r) {
  return (r * 180) / Math.PI;
}

function degToRad(d) {
  return (d * Math.PI) / 180;
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
  deg += 0.2;

  // F 的数量
  let numFs = 5;
  let radius = 200;

  // 计算透视矩阵
  let fieldOfViewRadians = degToRad(120);
  let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  let zNear = 1;
  let zFar = 2000;
  let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

  // 计算相机的位置矩阵
  let cameraAngleRadians = degToRad(deg); // 这里指定了相机的旋转角度
  let cameraMatrix = m4.yRotation(cameraAngleRadians);
  cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);
  // 取反, 作为视角矩阵
  let viewMatrix = m4.inverse(cameraMatrix);

  // 计算透视矩阵和视角的位置
  let viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  for (let ii = 0; ii < numFs; ++ii) {
    let angle = (ii * Math.PI * 2) / numFs;
    let x = Math.cos(angle) * radius;
    let y = Math.sin(angle) * radius;

    // starting with the view projection matrix
    // compute a matrix for the F
    let matrix = m4.translate(viewProjectionMatrix, x, 0, y);

    // Set the matrix.
    setUniforms('u_matrix', {
      values: [false, matrix],
      method: 'uniformMatrix4fv',
    });

    // Draw the geometry.
    gl.drawArrays(gl.TRIANGLES, 0, 16 * 6);
  }

  requestAnimationFrame(draw);
}

main();
