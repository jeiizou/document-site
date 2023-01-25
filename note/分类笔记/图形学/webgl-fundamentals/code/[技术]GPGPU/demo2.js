const vs = `
attribute vec4 position;
void main() {
  gl_Position = position;
}
`;

const fs = `
precision highp float;
 
uniform sampler2D srcTex;
uniform vec2 srcDimensions;
 
void main() {
  vec2 texcoord = gl_FragCoord.xy / srcDimensions;
  vec4 value = texture2D(srcTex, texcoord);
  gl_FragColor = value * 2.0;
}
`;

const dstWidth = 3;
const dstHeight = 2;

// 为 6 个结果制作 3x2 画布
const canvas = document.createElement('canvas');
canvas.width = dstWidth;
canvas.height = dstHeight;

const gl = canvas.getContext('webgl');

const program = webglUtils.createProgramFromSources(gl, [vs, fs]);
const positionLoc = gl.getAttribLocation(program, 'position');
const srcTexLoc = gl.getUniformLocation(program, 'srcTex');
const srcDimensionsLoc = gl.getUniformLocation(program, 'srcDimensions');

// 设置一个完整的画布剪辑空间四边形
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
// prettier-ignore
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  -1, -1,
  1, -1,
  -1, 1,
  -1, 1,
  1, -1,
  1, 1,
]), gl.STATIC_DRAW);

// 设置我们的属性来告诉 WebGL 如何拉
// 上面缓冲区的数据到位置属性
gl.enableVertexAttribArray(positionLoc);
gl.vertexAttribPointer(
  positionLoc,
  2, // 大小（组件数）
  gl.FLOAT, // 缓冲区中的数据类型
  false, // 标准化
  0, // 步幅（0 = 自动）
  0, // 抵消
);

// 创建我们的源纹理
const srcWidth = 3;
const srcHeight = 2;
const tex = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
gl.texImage2D(
  gl.TEXTURE_2D,
  0, // mip 级别
  gl.LUMINANCE, // 内部格式
  srcWidth,
  srcHeight,
  0, // 边界
  gl.LUMINANCE, // 格式
  gl.UNSIGNED_BYTE, // 类型
  new Uint8Array([1, 2, 3, 4, 5, 6]),
);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

gl.useProgram(program);
gl.uniform1i(srcTexLoc, 0); // 告诉着色器 src 纹理在纹理单元 0 上
gl.uniform2f(srcDimensionsLoc, srcWidth, srcHeight);

gl.drawArrays(gl.TRIANGLES, 0, 6); // 绘制2个三角形（6个顶点）

// 得到结果
const results = new Uint8Array(dstWidth * dstHeight * 4);
gl.readPixels(0, 0, dstWidth, dstHeight, gl.RGBA, gl.UNSIGNED_BYTE, results);

// 打印结果
for (let i = 0; i < dstWidth * dstHeight; ++i) {
  log(results[i * 4]);
}

function log(...args) {
  const elem = document.createElement('pre');
  elem.textContent = args.join(' ');
  document.body.appendChild(elem);
}
