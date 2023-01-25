'use strict';

// 定义全局变量
let canvas, gl;

// 初始化上下文环境和着色器
function init() {
  /** @type {HTMLCanvasElement} */
  canvas = document.querySelector('#canvas');
  gl = canvas.getContext('webgl');
  if (!gl) {
    throw Error('not support webgl');
  }

  // 初始化着色程序
  let program = webglUtils.createProgramFromScripts(gl, ['vertex-shader-2d', 'fragment-shader-2d']);
  gl.program = program;

  // 使用当前的着色器程序
  gl.useProgram(gl.program);

  // 设置视窗口位置
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  // 设置视口
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function clear() {
  // 清理画布
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
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

// Fill the buffer with the values that define a rectangle.
function setRectangle(gl, x, y, width, height) {
  let x1 = x;
  let x2 = x + width;
  let y1 = y;
  let y2 = y + height;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW,
  );
}

// 绘制这个图形
function drawTrangle({ count, offset, type = gl.TRIANGLES }) {
  clear();
  gl.drawArrays(type, offset, count);
}

function angleToSite(angle) {
  let radians = (angle * Math.PI) / 180;
  return [Math.sin(radians), Math.cos(radians)];
}

// 获取F的坐标点信息
function getFPosition() {
  return new Float32Array([
    // left column
    0, 0, 30, 0, 0, 150, 0, 150, 30, 0, 30, 150,

    // top rung
    30, 0, 100, 0, 30, 30, 30, 30, 100, 0, 100, 30,

    // middle rung
    30, 60, 67, 60, 30, 90, 30, 90, 67, 60, 67, 90,
  ]);
}

function main() {
  // 初始化上下文
  init();
  // 设置顶点变量的数据
  setAttributes('a_position', getFPosition(), {
    size: 2,
  });

  // 设置屏幕宽度
  setUniforms('u_resolution', {
    values: [gl.canvas.width, gl.canvas.height],
    method: 'uniform2f',
  });

  // 设置颜色
  setUniforms('u_color', {
    values: [[Math.random(), Math.random(), Math.random(), 1]],
    method: 'uniform4fv',
  });

  // 设置偏移
  setUniforms('u_translation', {
    values: [200, 200],
    method: 'uniform2f',
  });

  // 设置旋转
  setUniforms('u_rotation', {
    values: angleToSite(0),
    method: 'uniform2f',
  });

  // 设置缩放
  setUniforms('u_scale', {
    values: [0.5, 0.5],
    method: 'uniform2f',
  });

  // 绘制图形
  drawTrangle({
    count: 18,
    offset: 0,
  });
}

main();
