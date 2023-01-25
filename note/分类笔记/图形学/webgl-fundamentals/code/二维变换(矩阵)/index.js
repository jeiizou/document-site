'use strict';

const m3 = {
  translation(tx, ty) {
    // prettier-ignore
    return [
            1,  0,  0,  
            0,  1,  0,  
            tx, ty, 1 
        ];
  },
  rotation(angleInDegrees) {
    angleInDegrees = 360 - angleInDegrees;
    let angleInRadians = (angleInDegrees * Math.PI) / 180;

    let c = Math.cos(angleInRadians);
    let s = Math.sin(angleInRadians);
    // prettier-ignore
    return [
            c,-s, 0,
            s, c, 0,
            0, 0, 1,
        ]
  },
  scaling(sx, sy) {
    // prettier-ignore
    return [
            sx, 0,  0,
            0,  sy, 0,
            0,  0,  1
        ]
  },
  identity: function () {
    // prettier-ignore
    return [
          1, 0, 0,
          0, 1, 0,
          0, 0, 1,
        ];
  },
  projection: function (width, height) {
    // 注意：这个矩阵翻转了 Y 轴，所以 0 在上方
    // prettier-ignore
    return [
          2/width, 0,         0,
          0,       -2/height, 0,
          -1,      1,         1
        ];
  },

  // 矩阵乘法
  multiply(a, b) {
    var a00 = a[0 * 3 + 0];
    var a01 = a[0 * 3 + 1];
    var a02 = a[0 * 3 + 2];
    var a10 = a[1 * 3 + 0];
    var a11 = a[1 * 3 + 1];
    var a12 = a[1 * 3 + 2];
    var a20 = a[2 * 3 + 0];
    var a21 = a[2 * 3 + 1];
    var a22 = a[2 * 3 + 2];
    var b00 = b[0 * 3 + 0];
    var b01 = b[0 * 3 + 1];
    var b02 = b[0 * 3 + 2];
    var b10 = b[1 * 3 + 0];
    var b11 = b[1 * 3 + 1];
    var b12 = b[1 * 3 + 2];
    var b20 = b[2 * 3 + 0];
    var b21 = b[2 * 3 + 1];
    var b22 = b[2 * 3 + 2];
    return [
      b00 * a00 + b01 * a10 + b02 * a20,
      b00 * a01 + b01 * a11 + b02 * a21,
      b00 * a02 + b01 * a12 + b02 * a22,
      b10 * a00 + b11 * a10 + b12 * a20,
      b10 * a01 + b11 * a11 + b12 * a21,
      b10 * a02 + b11 * a12 + b12 * a22,
      b20 * a00 + b21 * a10 + b22 * a20,
      b20 * a01 + b21 * a11 + b22 * a21,
      b20 * a02 + b21 * a12 + b22 * a22,
    ];
  },

  translate(m, tx, ty) {
    return m3.multiply(m, m3.translation(tx, ty));
  },
  rotate: function (m, angleInRadians) {
    return m3.multiply(m, m3.rotation(angleInRadians));
  },
  scale: function (m, sx, sy) {
    return m3.multiply(m, m3.scaling(sx, sy));
  },
};

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

let translation = [200, 200];
let angleInRadians = 45;
let scale = [1, 1];

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

  var matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
  matrix = m3.translate(matrix, translation[0], translation[1]);
  matrix = m3.rotate(matrix, angleInRadians);
  matrix = m3.scale(matrix, scale[0], scale[1]);

  // 设置变换矩阵
  setUniforms('u_matrix', {
    values: [false, matrix],
    method: 'uniformMatrix3fv',
  });

  // 绘制图形
  drawTrangle({
    count: 18,
    offset: 0,
  });
}

main();
