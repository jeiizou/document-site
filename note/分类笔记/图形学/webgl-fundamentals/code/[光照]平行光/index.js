'use strict';
// 定义全局变量
let gl;

// 初始化上下文环境和着色器
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

// 绘制这个图形
function drawTrangle({ count, offset, type = gl.TRIANGLES }) {
  gl.drawArrays(type, offset, count);
}

function angleToSite(angle) {
  let radians = (angle * Math.PI) / 180;
  return [Math.sin(radians), Math.cos(radians)];
}

function makeZToWMatrix(fudgeFactor) {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, fudgeFactor, 0, 0, 0, 1];
}

function radToDeg(r) {
  return (r * 180) / Math.PI;
}

function degToRad(d) {
  return (d * Math.PI) / 180;
}

function main() {
  // 初始化上下文
  init();

  // 设置顶点位置
  setAttributes('a_position', getFPosition(), {
    size: 3,
  });
  // 设置各个面的法向量
  setAttributes('a_normal', getNormals(), {
    size: 3,
  });

  // 设置颜色
  setUniforms('u_color', {
    values: [[0.2, 1, 0.2, 1]],
    method: 'uniform4fv',
  });

  // 设置光照的方向
  setUniforms('u_reverseLightDirection', {
    values: [m4.normalize([0.5, 0.7, 1])],
    method: 'uniform3fv',
  });

  render();
}

let fieldOfViewRadians = degToRad(90);
let fRotationRadians = 0;
// 设置相机的矩阵参数
let camera = [100, 150, 200];
let target = [0, 35, 0];
let up = [0, 1, 0];

function getViewMatrix() {
  // 计算投影矩阵
  let aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  let zNear = 1;
  let zFar = 2000;
  let projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
  let cameraMatrix = m4.lookAt(camera, target, up);
  // 从相机矩阵生成视图矩阵
  let viewMatrix = m4.inverse(cameraMatrix);
  // 计算视图投影矩阵
  let viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

  return viewProjectionMatrix;
}

function render() {
  // 计算视图投影矩阵
  let viewProjectionMatrix = getViewMatrix();

  let worldMatrix = m4.yRotation(fRotationRadians);
  let worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
  let worldInverseMatrix = m4.inverse(worldMatrix);
  let worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

  setUniforms('u_worldViewProjection', {
    values: [false, worldViewProjectionMatrix],
    method: 'uniformMatrix4fv',
  });

  setUniforms('u_worldInverseTranspose', {
    values: [false, worldInverseTransposeMatrix],
    method: 'uniformMatrix4fv',
  });

  // 清除画布
  clear();
  // 绘制图形
  drawTrangle({
    count: 16 * 6,
    offset: 0,
  });
}

main();

// UI 事件绑定
webglLessonsUI.setupSlider('#fRotation', {
  value: radToDeg(fRotationRadians),
  slide: updateRotation,
  min: -360,
  max: 360,
});

function updateRotation(event, ui) {
  fRotationRadians = degToRad(ui.value);
  render();
  // console.log(ui.value);
}
