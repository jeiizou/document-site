'use strict';
const gl = document.querySelector('#c').getContext('webgl');

const vs = `
attribute float vertexId;
uniform float numVerts;
uniform vec2 resolution;

#define PI radians(180.0)

void main() {
  float u = vertexId / numVerts;      // goes from 0 to 1
  float angle = u * PI * 2.0;         // goes from 0 to 2PI
  float radius = 0.8;

  vec2 pos = vec2(cos(angle), sin(angle)) * radius;
  
  float aspect = resolution.y / resolution.x;
  vec2 scale = vec2(aspect, 1);
  
  gl_Position = vec4(pos * scale, 0, 1);
  gl_PointSize = 5.0;
}
`;

const fs = `
precision mediump float;

void main() {
  gl_FragColor = vec4(1, 0, 0, 1);
}
`;

// 设置GLSL程序
const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const vertexIdLoc = gl.getAttribLocation(program, 'vertexId');
const numVertsLoc = gl.getUniformLocation(program, 'numVerts');
const resolutionLoc = gl.getUniformLocation(program, 'resolution');

// Make a buffer with just a count in it.

const numVerts = 20;
const vertexIds = new Float32Array(numVerts);
vertexIds.forEach((v, i) => {
  vertexIds[i] = i;
});

const idBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexIds, gl.STATIC_DRAW);

// 开始绘制
webglUtils.resizeCanvasToDisplaySize(gl.canvas);
gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

gl.useProgram(program);

{
  // 开启属性
  gl.enableVertexAttribArray(vertexIdLoc);

  // 绑定缓冲区
  gl.bindBuffer(gl.ARRAY_BUFFER, idBuffer);

  // 告诉属性如何从idBuffer(ARRAY_BUFFER)中取出数据
  const size = 1; // 每次迭代一个组件
  const type = gl.FLOAT; // 数据是32位的浮点数
  const normalize = false; // 不要归一化数据
  const stride = 0; // 0 = 向前移动 size * sizeof(type) 每次迭代以获得下一个位置
  const offset = 0; // 从缓冲区的开头开始
  gl.vertexAttribPointer(vertexIdLoc, size, type, normalize, stride, offset);
}

// 告诉着色器顶点数量
gl.uniform1f(numVertsLoc, numVerts);
// 告诉着色器分辨率
gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

const offset = 0;
gl.drawArrays(gl.POINTS, offset, numVerts);
